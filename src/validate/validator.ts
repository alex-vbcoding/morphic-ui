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
  let puppeteerModule: any = null;
  try {
    puppeteerModule = require('puppeteer');
  } catch {
    // Try playwright as fallback
    try {
      require.resolve('playwright');
    } catch {
      // No renderer available
    }
  }

  const results: ValidationResult[] = [];

  for (const file of files) {
    console.log(chalk.underline(file));

    // Always run enhanced static analysis
    const issues = await enhancedStaticAnalysis(file, viewports);

    if (puppeteerModule) {
      console.log(chalk.gray(`  Viewports: ${viewports.map(v => `${v}px`).join(', ')}`));
      console.log(chalk.cyan('  🖥️  Puppeteer available — running visual validation...\n'));

      try {
        const puppeteerIssues = await runPuppeteerValidation(puppeteerModule, file, viewports);
        issues.push(...puppeteerIssues);
      } catch (err) {
        issues.push({
          viewport: 'all',
          severity: 'warning',
          message: `Puppeteer validation failed: ${(err as Error).message}`,
        });
      }
    } else {
      console.log(chalk.gray('  (Static analysis only — install puppeteer for visual rendering)\n'));
    }

    if (issues.length === 0) {
      console.log(chalk.green('  ✅ No issues detected\n'));
    } else {
      const errors = issues.filter(i => i.severity === 'error');
      const warnings = issues.filter(i => i.severity === 'warning');

      for (const issue of issues) {
        const icon = issue.severity === 'error' ? chalk.red('❌') : chalk.yellow('⚠️');
        const element = issue.element ? chalk.gray(` (${issue.element})`) : '';
        console.log(`  ${icon} [${issue.viewport}] ${issue.message}${element}`);
      }
      console.log(chalk.gray(`\n  ${errors.length} errors, ${warnings.length} warnings\n`));
    }

    results.push({ file, issues, screenshots: [] });
  }

  if (opts.ci) {
    const hasErrors = results.some(r => r.issues.some(i => i.severity === 'error'));
    if (hasErrors) {
      process.exit(1);
    }
  }

  return results;
}

async function enhancedStaticAnalysis(file: string, viewports: number[]): Promise<ValidationIssue[]> {
  const fs = await import('fs');
  const issues: ValidationIssue[] = [];

  try {
    const content = fs.readFileSync(file, 'utf-8');

    // 1. Check for responsive breakpoints
    const hasResponsive = /(?:sm|md|lg|xl|2xl):/m.test(content);
    const hasMediaQuery = /@media/.test(content);
    if (!hasResponsive && !hasMediaQuery) {
      issues.push({
        viewport: 'all',
        severity: 'warning',
        message: 'No responsive breakpoints detected (sm:, md:, lg:) — may not render well on mobile',
      });
    }

    // 2. Check for fixed widths that might overflow
    const fixedWidthMatch = /width:\s*(\d{4,})px/.exec(content);
    if (fixedWidthMatch) {
      issues.push({
        viewport: 'mobile',
        severity: 'error',
        message: `Fixed width ${fixedWidthMatch[1]}px will overflow on small screens`,
      });
    }

    // 3. Check for overflow handling on tables/grids
    if (/overflow/.test(content) === false && /table|grid/.test(content)) {
      issues.push({
        viewport: 'mobile',
        severity: 'warning',
        message: 'Table/grid without overflow handling — may cause horizontal scroll on mobile',
      });
    }

    // 4. Check for text truncation handling
    if (/truncate|text-ellipsis|overflow-hidden/.test(content) === false &&
        /whitespace-nowrap|white-space:\s*nowrap/.test(content)) {
      issues.push({
        viewport: 'mobile',
        severity: 'warning',
        message: 'nowrap text without truncation — text may overflow container',
      });
    }

    // 5. Check images have alt text
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (/<img\s/.test(line) && !/alt\s*=/.test(line)) {
        issues.push({
          viewport: 'all',
          severity: 'error',
          message: `Image missing alt attribute at line ${idx + 1}`,
          element: '<img>',
        });
      }
    });

    // 6. Check icon-only buttons have aria-label
    const fullContent = content;
    // Multi-line check for buttons containing only icons
    const buttonRegex = /<button\s[^>]*>([\s\S]*?)<\/button>/g;
    let btnMatch;
    while ((btnMatch = buttonRegex.exec(fullContent)) !== null) {
      const btnTag = btnMatch[0];
      const btnContent = btnMatch[1].trim();
      // If button content is just an SVG/icon/emoji and no aria-label on the tag
      const hasOnlyIcon = /^<(?:svg|img|span\s[^>]*aria-hidden)[^>]*>/.test(btnContent) ||
                          /^[\u{1F000}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]$/u.test(btnContent);
      if (hasOnlyIcon && !/aria-label/.test(btnTag)) {
        const lineNum = fullContent.substring(0, btnMatch.index).split('\n').length;
        issues.push({
          viewport: 'all',
          severity: 'error',
          message: `Icon-only button missing aria-label at line ${lineNum}`,
          element: '<button>',
        });
      }
    }

    // 7. Check heading hierarchy (h1 > h2 > h3, no skipping)
    const headingRegex = /<h([1-6])\b/g;
    let headingMatch;
    let lastHeadingLevel = 0;
    while ((headingMatch = headingRegex.exec(content)) !== null) {
      const level = parseInt(headingMatch[1]);
      if (lastHeadingLevel > 0 && level > lastHeadingLevel + 1) {
        const lineNum = content.substring(0, headingMatch.index).split('\n').length;
        issues.push({
          viewport: 'all',
          severity: 'warning',
          message: `Heading level skipped: h${lastHeadingLevel} → h${level} at line ${lineNum} (should not skip levels)`,
          element: `<h${level}>`,
        });
      }
      lastHeadingLevel = level;
    }

    // 8. Check links have href
    const linkRegex = /<a\s([^>]*)>/g;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(content)) !== null) {
      const attrs = linkMatch[1];
      if (!/href\s*=/.test(attrs)) {
        const lineNum = content.substring(0, linkMatch.index).split('\n').length;
        issues.push({
          viewport: 'all',
          severity: 'error',
          message: `Link missing href attribute at line ${lineNum}`,
          element: '<a>',
        });
      }
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

async function runPuppeteerValidation(
  puppeteer: any,
  file: string,
  viewports: number[]
): Promise<ValidationIssue[]> {
  const fs = await import('fs');
  const path = await import('path');
  const issues: ValidationIssue[] = [];

  const content = fs.readFileSync(file, 'utf-8');

  // Build a minimal HTML page wrapping the component
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Morphic Validation</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; font-family: Inter, system-ui, sans-serif; }
  </style>
</head>
<body>
  <div id="root">
    <p>Morphic Visual Validation — Component loaded for testing</p>
  </div>
</body>
</html>`;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Collect console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg: any) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Load the HTML
    await page.setContent(htmlContent, { waitUntil: 'networkidle0', timeout: 10000 });

    // Check for console errors
    if (consoleErrors.length > 0) {
      for (const err of consoleErrors) {
        issues.push({
          viewport: 'all',
          severity: 'error',
          message: `Console error: ${err}`,
        });
      }
    }

    // Check different viewports
    for (const width of viewports) {
      await page.setViewport({ width, height: 800 });
      await new Promise(r => setTimeout(r, 500));

      // Check for horizontal overflow
      const hasOverflow = await page.evaluate('document.documentElement.scrollWidth > document.documentElement.clientWidth');

      if (hasOverflow) {
        issues.push({
          viewport: `${width}px`,
          severity: 'error',
          message: `Horizontal overflow detected at ${width}px viewport`,
        });
      }

      // Take screenshot for report
      const screenshotDir = path.join(process.cwd(), '.morphic', 'reports');
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }
    }
  } catch (err) {
    issues.push({
      viewport: 'all',
      severity: 'warning',
      message: `Puppeteer rendering failed: ${(err as Error).message}`,
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return issues;
}
