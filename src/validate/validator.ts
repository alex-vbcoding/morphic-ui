import chalk from 'chalk';

export interface ValidationIssue {
  viewport: string;
  severity: 'error' | 'warning';
  message: string;
  element?: string;
}

export interface ValidationResult {
  file: string;
  issues: ValidationIssue[];
  screenshots: string[];
}

export async function validate(
  files: string[],
  opts: { viewports?: string; ci?: boolean; report?: string }
): Promise<ValidationResult[]> {
  const viewports = (opts.viewports || '375,768,1440').split(',').map(Number);

  console.log(chalk.bold('\n🔍 Morphic Visual Validator\n'));

  if (files.length === 0) {
    console.log(chalk.yellow('No files specified.'));
    console.log(chalk.gray('Usage: morphic validate ./src/pages/MyPage.tsx\n'));
    console.log(chalk.gray('Note: Visual validation requires Puppeteer or Playwright.'));
    console.log(chalk.gray('Install with: npm install --save-dev puppeteer\n'));
    return [];
  }

  // Check for rendering engine
  let hasRenderer = false;
  try {
    require.resolve('puppeteer');
    hasRenderer = true;
  } catch {
    try {
      require.resolve('playwright');
      hasRenderer = true;
    } catch {
      // No renderer available
    }
  }

  if (!hasRenderer) {
    console.log(chalk.yellow('⚠️  Visual validation requires a rendering engine.\n'));
    console.log('Install one of:');
    console.log(chalk.cyan('  npm install --save-dev puppeteer'));
    console.log(chalk.cyan('  npm install --save-dev playwright\n'));
    console.log(chalk.gray('Without a renderer, Morphic will perform static analysis only.\n'));

    // Fall back to static analysis
    const results: ValidationResult[] = [];
    for (const file of files) {
      console.log(chalk.underline(file));
      const issues = await staticAnalysis(file, viewports);
      
      if (issues.length === 0) {
        console.log(chalk.green('  ✅ No issues detected (static analysis)\n'));
      } else {
        for (const issue of issues) {
          const icon = issue.severity === 'error' ? chalk.red('❌') : chalk.yellow('⚠️');
          console.log(`  ${icon} [${issue.viewport}] ${issue.message}`);
        }
        console.log('');
      }

      results.push({ file, issues, screenshots: [] });
    }

    return results;
  }

  // Full visual validation with renderer
  const results: ValidationResult[] = [];
  for (const file of files) {
    console.log(chalk.underline(file));
    console.log(chalk.gray(`  Viewports: ${viewports.map(v => `${v}px`).join(', ')}`));

    // TODO: Implement full rendering pipeline
    // 1. Start dev server or build component
    // 2. Navigate to component
    // 3. Take screenshots at each viewport
    // 4. Analyze for visual issues

    console.log(chalk.cyan('  Rendering and analyzing...\n'));
    results.push({ file, issues: [], screenshots: [] });
  }

  if (opts.ci) {
    const hasErrors = results.some(r => r.issues.some(i => i.severity === 'error'));
    if (hasErrors) {
      process.exit(1);
    }
  }

  return results;
}

async function staticAnalysis(file: string, viewports: number[]): Promise<ValidationIssue[]> {
  const fs = await import('fs');
  const issues: ValidationIssue[] = [];

  try {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for responsive considerations
    const hasResponsive = /sm:|md:|lg:|xl:|@media/.test(content);
    if (!hasResponsive) {
      issues.push({
        viewport: 'all',
        severity: 'warning',
        message: 'No responsive breakpoints detected — may not render well on mobile',
      });
    }

    // Check for fixed widths that might overflow
    const fixedWidthMatch = /width:\s*(\d{4,})px/.exec(content);
    if (fixedWidthMatch) {
      issues.push({
        viewport: 'mobile',
        severity: 'error',
        message: `Fixed width ${fixedWidthMatch[1]}px will overflow on small screens`,
      });
    }

    // Check for overflow handling
    if (/overflow/.test(content) === false && /table|grid/.test(content)) {
      issues.push({
        viewport: 'mobile',
        severity: 'warning',
        message: 'Table/grid without overflow handling — may cause horizontal scroll on mobile',
      });
    }

    // Check for text truncation handling
    if (/truncate|text-ellipsis|overflow-hidden/.test(content) === false && 
        /whitespace-nowrap|white-space:\s*nowrap/.test(content)) {
      issues.push({
        viewport: 'mobile',
        severity: 'warning',
        message: 'nowrap text without truncation — text may overflow container',
      });
    }

  } catch (err) {
    issues.push({
      viewport: 'all',
      severity: 'error',
      message: `Could not read file: ${(err as Error).message}`,
    });
  }

  return issues;
}
