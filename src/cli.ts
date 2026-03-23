import { Command } from 'commander';
import chalk from 'chalk';

const program = new Command();

program
  .name('morphic')
  .description('AI design guardrail toolkit — Make LLMs better at UI code')
  .version('0.1.0');

// Create project
program
  .command('create <name>')
  .description('Create a new project with Morphic design system built-in')
  .option('--template <template>', 'Project template (nextjs-tailwind, react-tailwind)', 'nextjs-tailwind')
  .option('--skip-install', 'Skip npm install')
  .action(async (name, opts) => {
    const { createProject } = await import('./create/creator');
    await createProject(name, { template: opts.template, skip: opts.skipInstall });
  });

// Phase 1: Design Context
program
  .command('init')
  .description('Initialize .morphic/ design context for your project')
  .option('--stack <stack>', 'UI stack (react-tailwind, react-mui, vue-tailwind, etc.)')
  .option('--preset <preset>', 'Use a preset (minimal, full, enterprise)')
  .option('-y, --yes', 'Skip interactive prompts, use defaults')
  .action(async (opts) => {
    const { initContext } = await import('./init/wizard');
    await initContext(opts);
  });

program
  .command('context')
  .description('Show or validate current design context')
  .option('--validate', 'Validate context.json')
  .option('--show', 'Display current context')
  .action(async (opts) => {
    const { loadContext, validateContext } = await import('./init/wizard');
    if (opts.validate) {
      const result = validateContext();
      if (result.valid) {
        console.log(chalk.green('✅ Context is valid'));
      } else {
        console.log(chalk.red('❌ Context errors:'));
        result.errors.forEach((e: string) => console.log(chalk.red(`  - ${e}`)));
      }
    } else {
      const ctx = loadContext();
      if (ctx) {
        console.log(chalk.bold('\n📋 Current Design Context:\n'));
        console.log(JSON.stringify(ctx, null, 2));
      } else {
        console.log(chalk.yellow('No .morphic/context.json found. Run `morphic init` first.'));
      }
    }
  });

// Phase 2: Design Lint
program
  .command('lint [paths...]')
  .description('Lint source files for design consistency')
  .option('--fix', 'Auto-fix issues where possible')
  .option('--format <format>', 'Output format (text, json)', 'text')
  .option('--rules <rules>', 'Comma-separated rules to run')
  .option('--ignore <patterns>', 'Comma-separated patterns to ignore')
  .action(async (paths, opts) => {
    const { runLint } = await import('./lint/linter');
    const targetPaths = paths.length > 0 ? paths : ['./src'];
    await runLint(targetPaths, opts);
  });

// Phase 3: Codegen
program
  .command('generate')
  .description('Generate page or component scaffolds')
  .option('--page <type>', 'Page type (landing, pricing, dashboard, settings, auth, 404)')
  .option('--component <type>', 'Component type (form, data-table, card-grid, navigation, hero)')
  .option('--list', 'List available templates')
  .option('--output <dir>', 'Output directory', './src')
  .action(async (opts) => {
    const { generate } = await import('./generate/generator');
    await generate(opts);
  });

// Phase 4: Visual Validation
program
  .command('validate [files...]')
  .description('Render and visually validate components')
  .option('--viewports <sizes>', 'Comma-separated viewports (375,768,1440)', '375,768,1440')
  .option('--ci', 'CI mode — exit with code 1 on errors')
  .option('--report <format>', 'Report format (html, json)', 'html')
  .action(async (files, opts) => {
    const { validate } = await import('./validate/validator');
    await validate(files, opts);
  });

// Docs generation
program
  .command('docs')
  .description('Generate design system documentation website')
  .option('--output <dir>', 'Output directory', '.morphic/docs')
  .option('--serve', 'Start a local preview server')
  .option('--port <port>', 'Server port', '4321')
  .action(async (opts) => {
    const { generateDocs } = await import('./docs/docs-generator');
    await generateDocs({ output: opts.output, serve: opts.serve, port: parseInt(opts.port) });
  });

program.parse();
