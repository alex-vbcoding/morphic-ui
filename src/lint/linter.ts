import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { loadContext } from '../init/wizard';

export interface LintIssue {
  file: string;
  line: number;
  column: number;
  severity: 'error' | 'warning';
  rule: string;
  message: string;
  fix?: string;
}

export interface LintResult {
  files: number;
  errors: number;
  warnings: number;
  issues: LintIssue[];
  fixable: number;
}

function findFiles(dir: string, extensions = ['.tsx', '.jsx', '.ts', '.js', '.css', '.scss']): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist') {
      results.push(...findFiles(fullPath, extensions));
    } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

// Rule: Hardcoded hex colors
function checkHardcodedColors(content: string, file: string, context: any): LintIssue[] {
  const issues: LintIssue[] = [];
  const lines = content.split('\n');
  const hexPattern = /#[0-9a-fA-F]{6}\b/g;

  // Skip CSS variable definitions and tailwind config
  if (file.endsWith('.config.js') || file.endsWith('.config.ts')) return issues;

  const isCssFile = file.endsWith('.css') || file.endsWith('.scss');

  lines.forEach((line, idx) => {
    // Skip comments and imports
    if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('import')) return;

    // Skip CSS custom property definitions (e.g. --foreground: ...; or --token-xxx: ...)
    if (isCssFile && /^\s*--[\w-]+\s*:/.test(line)) return;

    // Skip var() fallback values in CSS (e.g. var(--token-foreground, #0f172a))
    if (isCssFile && /var\(--[\w-]+,\s*#[0-9a-fA-F]{6}\)/.test(line)) return;

    let match;
    while ((match = hexPattern.exec(line)) !== null) {
      const color = match[0];
      // Check if it's a known token
      const tokenName = Object.entries(context?.tokens?.colors || {})
        .find(([_, val]) => (val as string).toLowerCase() === color.toLowerCase());

      issues.push({
        file,
        line: idx + 1,
        column: match.index + 1,
        severity: 'error',
        rule: 'no-hardcoded-colors',
        message: `Hardcoded color "${color}"${tokenName ? ` — use token "${tokenName[0]}" instead` : ' — use a design token'}`,
        fix: tokenName ? `Replace with token "${tokenName[0]}"` : undefined,
      });
    }
  });

  return issues;
}

// Rule: Spacing consistency (inline CSS)
function checkSpacing(content: string, file: string, context: any): LintIssue[] {
  const issues: LintIssue[] = [];
  const lines = content.split('\n');
  const spacingScale = context?.tokens?.spacing || [];
  const pxPattern = /(?:padding|margin|gap|top|right|bottom|left)\s*:\s*(\d+)px/g;

  lines.forEach((line, idx) => {
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;

    let match;
    while ((match = pxPattern.exec(line)) !== null) {
      const value = parseInt(match[1]);
      if (spacingScale.length > 0 && !spacingScale.includes(value)) {
        const closest = spacingScale.reduce((prev: number, curr: number) =>
          Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
        );
        issues.push({
          file,
          line: idx + 1,
          column: match.index + 1,
          severity: 'warning',
          rule: 'spacing-scale',
          message: `Spacing value "${value}px" not in scale — closest: ${closest}px`,
          fix: `Change to ${closest}px`,
        });
      }
    }
  });

  return issues;
}

// Rule: Accessibility checks
function checkAccessibility(content: string, file: string): LintIssue[] {
  const issues: LintIssue[] = [];
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Check for img without alt
    if (/<img\s/.test(line) && !/alt\s*=/.test(line)) {
      issues.push({
        file,
        line: idx + 1,
        column: 1,
        severity: 'error',
        rule: 'require-alt-text',
        message: '<img> missing alt attribute',
        fix: 'Add alt="descriptive text"',
      });
    }

    // Check for button/a without aria-label or text content
    if (/<(?:button|a)\s[^>]*>\s*<(?:svg|img|icon)/i.test(line) && !/aria-label/.test(line)) {
      issues.push({
        file,
        line: idx + 1,
        column: 1,
        severity: 'error',
        rule: 'require-aria-label',
        message: 'Icon-only interactive element missing aria-label',
        fix: 'Add aria-label="descriptive text"',
      });
    }

    // Check for onClick on non-interactive elements
    if (/onClick\s*=/.test(line) && /<(?:div|span|p)\s/.test(line) && !/role=/.test(line)) {
      issues.push({
        file,
        line: idx + 1,
        column: 1,
        severity: 'warning',
        rule: 'interactive-role',
        message: 'onClick on non-interactive element without role attribute — use <button> or add role="button"',
      });
    }
  });

  return issues;
}

// Rule: Inline styles
function checkInlineStyles(content: string, file: string): LintIssue[] {
  const issues: LintIssue[] = [];
  const lines = content.split('\n');
  const stylePattern = /style\s*=\s*\{\{/;

  lines.forEach((line, idx) => {
    if (stylePattern.test(line)) {
      issues.push({
        file,
        line: idx + 1,
        column: 1,
        severity: 'warning',
        rule: 'no-inline-styles',
        message: 'Inline style detected — prefer design tokens or utility classes',
      });
    }
  });

  return issues;
}

// Rule: Check Tailwind color classes against design tokens
function checkTailwindTokens(content: string, file: string, context: any): LintIssue[] {
  const issues: LintIssue[] = [];

  // Only check JSX/TSX files
  if (!file.endsWith('.tsx') && !file.endsWith('.jsx')) return issues;

  const tokenColorKeys = new Set(Object.keys(context?.tokens?.colors || {}));

  // Always-allowed color names in Tailwind classes
  const alwaysAllowed = new Set(['white', 'black', 'transparent', 'current', 'inherit']);

  // Tailwind named color families that are NOT token-based
  const namedColorFamilies = [
    'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal',
    'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
    'slate', 'zinc', 'neutral', 'stone',
  ];

  // Gray shades get warning instead of error
  const grayFamily = 'gray';

  // Color utility prefixes
  const colorPrefixes = [
    'bg', 'text', 'border', 'ring', 'outline', 'shadow',
    'from', 'via', 'to', 'divide', 'placeholder',
    'decoration', 'accent', 'caret', 'fill', 'stroke',
  ];

  // Build regex to match Tailwind color classes
  // Match patterns like: bg-blue-600, text-red-500, border-green-300, hover:bg-blue-500, focus:text-red-400
  const prefixGroup = colorPrefixes.join('|');
  const colorClassPattern = new RegExp(
    `(?:^|\\s|"|'|\`)(?:(?:hover|focus|active|disabled|group-hover|focus-within|focus-visible|dark|sm|md|lg|xl|2xl):)*(?:${prefixGroup})-(\\w[\\w-]*)(?=\\s|"|'|\`|$)`,
    'g'
  );

  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Skip comments and imports
    if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('import')) return;

    // Only look inside className strings
    const classNameMatches = line.matchAll(/className\s*=\s*(?:{[^}]*["`']([^"`']*)["`'][^}]*}|"([^"]*)"|'([^']*)'|{`([^`]*)`})/g);

    for (const cm of classNameMatches) {
      const classString = cm[1] || cm[2] || cm[3] || cm[4] || '';
      if (!classString) continue;

      // Extract individual classes
      const classes = classString.split(/\s+/);

      for (const cls of classes) {
        // Strip responsive/state prefixes
        const baseCls = cls.replace(/^(?:(?:hover|focus|active|disabled|group-hover|focus-within|focus-visible|dark|sm|md|lg|xl|2xl):)*/, '');

        // Check if it's a color utility
        const colorMatch = baseCls.match(new RegExp(`^(?:${prefixGroup})-(.+)$`));
        if (!colorMatch) continue;

        const colorName = colorMatch[1];

        // Always allowed
        if (alwaysAllowed.has(colorName)) continue;

        // Token color — allowed
        if (tokenColorKeys.has(colorName)) continue;

        // Check if it's a named Tailwind color (e.g. blue-600, red-500)
        const namedMatch = colorName.match(/^(\w+)-(\d+)$/);
        if (namedMatch) {
          const family = namedMatch[1];

          // Gray shades — warning (common neutral colors)
          if (family === grayFamily) {
            issues.push({
              file,
              line: idx + 1,
              column: 1,
              severity: 'warning',
              rule: 'tailwind-token-colors',
              message: `Gray shade "${baseCls}" — consider using a token like "foreground-muted" or "border" for consistency`,
            });
            continue;
          }

          // Other named colors — warning (should use tokens)
          if (namedColorFamilies.includes(family)) {
            issues.push({
              file,
              line: idx + 1,
              column: 1,
              severity: 'warning',
              rule: 'tailwind-token-colors',
              message: `Non-token color class "${baseCls}" — use a design token class (e.g. bg-primary, text-foreground) instead`,
            });
            continue;
          }
        }

        // Check for standalone color families without shade (e.g. bg-blue, text-red) — unlikely but possible
        if (namedColorFamilies.includes(colorName) || colorName === grayFamily) {
          issues.push({
            file,
            line: idx + 1,
            column: 1,
            severity: 'warning',
            rule: 'tailwind-token-colors',
            message: `Non-token color class "${baseCls}" — use a design token class instead`,
          });
        }
      }
    }
  });

  return issues;
}

// Rule: Check arbitrary spacing values in Tailwind classes
function checkArbitrarySpacing(content: string, file: string, context: any): LintIssue[] {
  const issues: LintIssue[] = [];

  // Only check JSX/TSX files
  if (!file.endsWith('.tsx') && !file.endsWith('.jsx')) return issues;

  const spacingScale = context?.tokens?.spacing || [];

  const lines = content.split('\n');

  // Pattern: p-[13px], m-[22px], gap-[15px], px-[10px], mt-[30px], etc.
  const arbitraryPattern = /(?:^|[\s"'`])(?:(?:hover|focus|active|disabled|dark|sm|md|lg|xl|2xl):)*(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y|space-x|space-y|inset|top|right|bottom|left|w|h|min-w|min-h|max-w|max-h)-\[(\d+)px\]/g;

  lines.forEach((line, idx) => {
    if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('import')) return;

    let match;
    while ((match = arbitraryPattern.exec(line)) !== null) {
      const value = parseInt(match[1]);
      if (spacingScale.length > 0 && !spacingScale.includes(value)) {
        const closest = spacingScale.reduce((prev: number, curr: number) =>
          Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
        );
        issues.push({
          file,
          line: idx + 1,
          column: match.index + 1,
          severity: 'warning',
          rule: 'arbitrary-spacing',
          message: `Arbitrary spacing value "${value}px" not in spacing scale — closest: ${closest}px. Use Tailwind's spacing utilities instead.`,
          fix: `Consider using a standard spacing value (${closest}px)`,
        });
      }
    }
  });

  return issues;
}

export async function runLint(
  paths: string[],
  opts: { fix?: boolean; format?: string; rules?: string; ignore?: string }
): Promise<LintResult> {
  const context = loadContext();

  if (!context) {
    console.log(chalk.yellow('\n⚠️  No .morphic/context.json found. Using default rules.'));
    console.log(chalk.gray('  Run `morphic init` for project-specific checks.\n'));
  }

  const allIssues: LintIssue[] = [];
  let totalFiles = 0;

  for (const p of paths) {
    const resolvedPath = path.resolve(p);
    const files = fs.statSync(resolvedPath).isDirectory()
      ? findFiles(resolvedPath)
      : [resolvedPath];

    for (const file of files) {
      totalFiles++;
      const content = fs.readFileSync(file, 'utf-8');
      const relFile = path.relative(process.cwd(), file);

      const issues = [
        ...checkHardcodedColors(content, relFile, context),
        ...checkSpacing(content, relFile, context),
        ...checkAccessibility(content, relFile),
        ...checkInlineStyles(content, relFile),
        ...checkTailwindTokens(content, relFile, context),
        ...checkArbitrarySpacing(content, relFile, context),
      ];

      allIssues.push(...issues);
    }
  }

  const errors = allIssues.filter(i => i.severity === 'error').length;
  const warnings = allIssues.filter(i => i.severity === 'warning').length;
  const fixable = allIssues.filter(i => i.fix).length;

  // Output
  if (opts.format === 'json') {
    console.log(JSON.stringify({ files: totalFiles, errors, warnings, fixable, issues: allIssues }, null, 2));
  } else {
    if (allIssues.length === 0) {
      console.log(chalk.green(`\n✅ No issues found in ${totalFiles} files\n`));
    } else {
      // Group by file
      const byFile = new Map<string, LintIssue[]>();
      for (const issue of allIssues) {
        const arr = byFile.get(issue.file) || [];
        arr.push(issue);
        byFile.set(issue.file, arr);
      }

      console.log('');
      for (const [file, issues] of byFile) {
        console.log(chalk.underline(file));
        for (const issue of issues) {
          const icon = issue.severity === 'error' ? chalk.red('❌') : chalk.yellow('⚠️');
          const loc = chalk.gray(`L${issue.line}:${issue.column}`);
          const rule = chalk.gray(`(${issue.rule})`);
          console.log(`  ${icon} ${loc} ${issue.message} ${rule}`);
        }
        console.log('');
      }

      console.log(
        `Found ${chalk.red(`${errors} errors`)}, ${chalk.yellow(`${warnings} warnings`)} in ${totalFiles} files`
      );
      if (fixable > 0) {
        console.log(chalk.cyan(`Run \`morphic lint --fix\` to auto-fix ${fixable} issues`));
      }
      console.log('');
    }
  }

  return { files: totalFiles, errors, warnings, issues: allIssues, fixable };
}
