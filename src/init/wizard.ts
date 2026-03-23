import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import chalk from 'chalk';
import { MorphicContext, DEFAULT_CONTEXT, PRESETS, STACK_PRESETS } from './defaults';

const MORPHIC_DIR = '.morphic';
const CONTEXT_FILE = 'context.json';

function ask(rl: readline.Interface, question: string, defaultVal?: string): Promise<string> {
  const suffix = defaultVal ? ` ${chalk.gray(`(${defaultVal})`)}` : '';
  return new Promise((resolve) => {
    rl.question(`${question}${suffix}: `, (answer) => {
      resolve(answer.trim() || defaultVal || '');
    });
  });
}

function select(rl: readline.Interface, question: string, options: string[], defaultIdx = 0): Promise<string> {
  return new Promise((resolve) => {
    console.log(`\n${question}`);
    options.forEach((opt, i) => {
      const marker = i === defaultIdx ? chalk.cyan('❯') : ' ';
      console.log(`  ${marker} ${i + 1}. ${opt}`);
    });
    rl.question(`\nChoice ${chalk.gray(`(1-${options.length}, default ${defaultIdx + 1})`)}: `, (answer) => {
      const idx = parseInt(answer) - 1;
      resolve(options[idx >= 0 && idx < options.length ? idx : defaultIdx]);
    });
  });
}

export async function initContext(opts: { stack?: string; preset?: string; yes?: boolean }): Promise<void> {
  const morphicDir = path.resolve(process.cwd(), MORPHIC_DIR);
  const contextPath = path.join(morphicDir, CONTEXT_FILE);

  console.log(chalk.bold('\n🎯 Morphic — Design Context Setup\n'));

  if (fs.existsSync(contextPath)) {
    console.log(chalk.yellow('⚠️  .morphic/context.json already exists.'));
    if (!opts.yes) {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const overwrite = await ask(rl, 'Overwrite? (y/N)', 'N');
      rl.close();
      if (overwrite.toLowerCase() !== 'y') {
        console.log(chalk.gray('Cancelled.'));
        return;
      }
    }
  }

  let context: MorphicContext = { ...DEFAULT_CONTEXT };

  // Apply preset if specified
  if (opts.preset && PRESETS[opts.preset]) {
    context = { ...context, ...PRESETS[opts.preset] } as MorphicContext;
    console.log(chalk.green(`✅ Applied preset: ${opts.preset}`));
  }

  // Apply stack if specified
  if (opts.stack && STACK_PRESETS[opts.stack]) {
    context.stack = STACK_PRESETS[opts.stack];
    console.log(chalk.green(`✅ Applied stack: ${opts.stack}`));
  }

  // Interactive mode
  if (!opts.yes && !opts.stack) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    // Stack selection
    const stackOptions = Object.keys(STACK_PRESETS);
    const selectedStack = await select(rl, 'What\'s your UI stack?', stackOptions, 0);
    context.stack = STACK_PRESETS[selectedStack];

    // Primary color
    const primaryColor = await ask(rl, '\nPrimary brand color (hex)', context.tokens.colors.primary);
    if (primaryColor.match(/^#[0-9a-fA-F]{6}$/)) {
      context.tokens.colors.primary = primaryColor;
    }

    // Accessibility level
    const a11yLevel = await select(rl, 'Accessibility level?', ['A (minimum)', 'AA (recommended)', 'AAA (strict)'], 1);
    context.accessibility.level = a11yLevel.split(' ')[0] as 'A' | 'AA' | 'AAA';
    if (context.accessibility.level === 'AAA') {
      context.accessibility.minContrast = 7;
      context.accessibility.minTouchTarget = '48px';
    }

    // Component directory
    const compDir = await ask(rl, '\nComponent directory', context.patterns.componentDir);
    context.patterns.componentDir = compDir;

    // Page directory
    const pageDir = await ask(rl, 'Page directory', context.patterns.pageDir);
    context.patterns.pageDir = pageDir;

    rl.close();
  }

  // Write context
  if (!fs.existsSync(morphicDir)) {
    fs.mkdirSync(morphicDir, { recursive: true });
  }

  fs.writeFileSync(contextPath, JSON.stringify(context, null, 2) + '\n');

  // Create .gitignore for morphic reports
  const gitignorePath = path.join(morphicDir, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, 'reports/\n*.html\n');
  }

  console.log(chalk.bold.green('\n✅ Design context created!\n'));
  console.log(chalk.gray(`  Config: ${contextPath}`));
  console.log(chalk.gray(`  Stack:  ${context.stack.framework} + ${context.stack.ui}`));
  console.log(chalk.gray(`  A11y:   WCAG ${context.accessibility.level}`));
  console.log(chalk.gray(`  Rules:  ${context.rules.length} design rules`));
  console.log(chalk.gray(`  Tokens: ${Object.keys(context.tokens.colors).length} colors, ${context.tokens.spacing.length} spacing values`));
  console.log(`\n${chalk.cyan('Next steps:')}`);
  console.log(`  1. Review .morphic/context.json and customize tokens/rules`);
  console.log(`  2. Include context.json in your LLM prompts for consistent code`);
  console.log(`  3. Run ${chalk.bold('morphic lint ./src')} to check existing code`);
  console.log('');
}

export function loadContext(dir?: string): MorphicContext | null {
  const contextPath = path.resolve(dir || process.cwd(), MORPHIC_DIR, CONTEXT_FILE);
  if (!fs.existsSync(contextPath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(contextPath, 'utf-8');
    return JSON.parse(raw) as MorphicContext;
  } catch {
    return null;
  }
}

export function validateContext(dir?: string): { valid: boolean; errors: string[] } {
  const context = loadContext(dir);
  const errors: string[] = [];

  if (!context) {
    return { valid: false, errors: ['No .morphic/context.json found. Run `morphic init` first.'] };
  }

  if (!context.version) errors.push('Missing version field');
  if (!context.stack?.framework) errors.push('Missing stack.framework');
  if (!context.stack?.ui) errors.push('Missing stack.ui');
  if (!context.tokens?.colors) errors.push('Missing tokens.colors');
  if (!context.tokens?.spacing || !Array.isArray(context.tokens.spacing)) {
    errors.push('Missing or invalid tokens.spacing (must be array)');
  }
  if (!context.tokens?.colors?.primary) errors.push('Missing tokens.colors.primary');
  if (!context.accessibility?.level) errors.push('Missing accessibility.level');
  if (context.accessibility?.level && !['A', 'AA', 'AAA'].includes(context.accessibility.level)) {
    errors.push('Invalid accessibility.level (must be A, AA, or AAA)');
  }
  if (!context.rules || !Array.isArray(context.rules)) {
    errors.push('Missing or invalid rules (must be array)');
  }

  return { valid: errors.length === 0, errors };
}
