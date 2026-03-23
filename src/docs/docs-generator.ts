import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { loadContext } from '../init/wizard';
import { MorphicContext } from '../init/defaults';

export async function generateDocs(opts: { output?: string; serve?: boolean; port?: number }): Promise<void> {
  const context = loadContext();
  
  if (!context) {
    console.log(chalk.yellow('\n⚠️  No .morphic/context.json found. Run `morphic init` first.\n'));
    return;
  }

  const outputDir = path.resolve(opts.output || '.morphic/docs');
  
  console.log(chalk.bold('\n📚 Morphic — Generating Design System Documentation\n'));

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate all doc pages
  writeFile(outputDir, 'index.html', generateIndexPage(context));
  writeFile(outputDir, 'getting-started.html', generateGettingStartedPage(context));
  writeFile(outputDir, 'tokens.html', generateTokensPage(context));
  writeFile(outputDir, 'components.html', generateComponentsPage(context));
  writeFile(outputDir, 'patterns.html', generatePatternsPage(context));
  writeFile(outputDir, 'accessibility.html', generateAccessibilityPage(context));
  writeFile(outputDir, 'guidelines.html', generateGuidelinesPage(context));
  writeFile(outputDir, 'style.css', generateCSS(context));

  console.log(chalk.green(`✅ Documentation generated in ${path.relative(process.cwd(), outputDir)}/\n`));
  console.log(chalk.gray('  Pages:'));
  console.log(chalk.gray('  • index.html           — Overview'));
  console.log(chalk.gray('  • getting-started.html — Installation & Setup'));
  console.log(chalk.gray('  • tokens.html          — Design Tokens (colors, spacing, typography)'));
  console.log(chalk.gray('  • components.html      — Component Guidelines'));
  console.log(chalk.gray('  • patterns.html        — Layout Patterns'));
  console.log(chalk.gray('  • accessibility.html   — Accessibility Standards'));
  console.log(chalk.gray('  • guidelines.html      — Development Guidelines & Rules'));

  if (opts.serve) {
    const port = opts.port || 4321;
    console.log(chalk.cyan(`\n🌐 Starting docs server on http://localhost:${port}\n`));
    const http = await import('http');
    const server = http.createServer((req, res) => {
      let filePath = path.join(outputDir, req.url === '/' ? 'index.html' : req.url || 'index.html');
      if (!filePath.endsWith('.html') && !filePath.endsWith('.css')) filePath += '.html';
      
      const ext = path.extname(filePath);
      const contentType = ext === '.css' ? 'text/css' : 'text/html';
      
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      } catch {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
      }
    });
    server.listen(port);
    console.log(chalk.gray('  Press Ctrl+C to stop\n'));
  } else {
    console.log(chalk.cyan(`\nTo preview: morphic docs --serve`));
    console.log(chalk.gray(`Or open ${path.relative(process.cwd(), outputDir)}/index.html in your browser\n`));
  }
}

function nav(active: string): string {
  const items = [
    { href: 'index.html', label: 'Overview' },
    { href: 'getting-started.html', label: 'Getting Started' },
    { href: 'tokens.html', label: 'Tokens' },
    { href: 'components.html', label: 'Components' },
    { href: 'patterns.html', label: 'Patterns' },
    { href: 'accessibility.html', label: 'Accessibility' },
    { href: 'guidelines.html', label: 'Guidelines' },
  ];
  return `<nav class="sidebar" aria-label="Documentation navigation">
    <div class="sidebar-brand">🎯 Design System</div>
    ${items.map(i => `<a href="${i.href}" class="${active === i.href ? 'active' : ''}">${i.label}</a>`).join('\n    ')}
  </nav>`;
}

function page(title: string, activeNav: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Design System</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  ${nav(activeNav)}
  <main class="content">
    ${content}
  </main>
</body>
</html>`;
}

function generateIndexPage(ctx: MorphicContext): string {
  return page('Overview', 'index.html', `
    <h1>Design System Documentation</h1>
    <p class="lead">A comprehensive guide to our design system — tokens, components, patterns, and development guidelines.</p>
    
    <div class="card-grid">
      <a href="getting-started.html" class="card">
        <h3>🚀 Getting Started</h3>
        <p>Installation, setup, and your first component.</p>
      </a>
      <a href="tokens.html" class="card">
        <h3>🎨 Design Tokens</h3>
        <p>${Object.keys(ctx.tokens.colors).length} colors, ${ctx.tokens.spacing.length} spacing values, typography scale.</p>
      </a>
      <a href="components.html" class="card">
        <h3>🧩 Components</h3>
        <p>Component guidelines, usage examples, and best practices.</p>
      </a>
      <a href="patterns.html" class="card">
        <h3>📐 Patterns</h3>
        <p>Layout patterns, page templates, and composition rules.</p>
      </a>
      <a href="accessibility.html" class="card">
        <h3>♿ Accessibility</h3>
        <p>WCAG ${ctx.accessibility.level} compliance, contrast ratios, and keyboard navigation.</p>
      </a>
      <a href="guidelines.html" class="card">
        <h3>📋 Guidelines</h3>
        <p>${ctx.rules.length} development rules and coding standards.</p>
      </a>
    </div>

    <h2>Stack</h2>
    <table>
      <tr><td><strong>Framework</strong></td><td>${ctx.stack.framework}</td></tr>
      <tr><td><strong>UI Library</strong></td><td>${ctx.stack.ui}</td></tr>
      <tr><td><strong>Language</strong></td><td>${ctx.stack.language}</td></tr>
      <tr><td><strong>CSS Approach</strong></td><td>${ctx.stack.cssApproach}</td></tr>
    </table>
  `);
}

function generateGettingStartedPage(ctx: MorphicContext): string {
  return page('Getting Started', 'getting-started.html', `
    <h1>Getting Started</h1>
    <p class="lead">How to install, configure, and start using the design system.</p>

    <h2>1. Installation</h2>
    <pre><code># Install Morphic CLI
npm install -g morphic-ui

# Create a new project with the design system
morphic create my-project

# Or add to an existing project
cd my-project
morphic init</code></pre>

    <h2>2. Project Structure</h2>
    <pre><code>my-project/
├── .morphic/
│   └── context.json       # Design tokens & rules
├── src/
│   ├── app/               # Pages
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Home page
│   │   ├── pricing/
│   │   └── dashboard/
│   └── components/         # Shared components
├── tailwind.config.ts      # Tokens → Tailwind
└── package.json</code></pre>

    <h2>3. Using Design Tokens</h2>
    <p>All design tokens are defined in <code>.morphic/context.json</code> and mapped to your CSS framework.</p>

    <h3>Colors</h3>
    <pre><code>/* ✅ Do — Use token classes */
&lt;button className="bg-primary text-white hover:bg-primary-hover"&gt;

/* ❌ Don't — Hardcode colors */
&lt;button style={{ backgroundColor: '#2563EB' }}&gt;</code></pre>

    <h3>Spacing</h3>
    <pre><code>/* ✅ Do — Use spacing scale */
&lt;div className="p-4 gap-6"&gt;     /* 16px padding, 24px gap */

/* ❌ Don't — Arbitrary values */
&lt;div className="p-[13px] gap-[22px]"&gt;</code></pre>

    <h3>Typography</h3>
    <pre><code>/* Heading hierarchy */
&lt;h1 className="text-4xl font-bold"&gt;     /* Page title */
&lt;h2 className="text-2xl font-bold"&gt;     /* Section title */
&lt;h3 className="text-xl font-semibold"&gt;  /* Card title */
&lt;p className="text-base text-gray-600"&gt; /* Body text */</code></pre>

    <h2>4. Linting Your Code</h2>
    <pre><code># Check for design system violations
morphic lint ./src

# Auto-fix where possible
morphic lint --fix ./src</code></pre>

    <h2>5. Generating Components</h2>
    <pre><code># Generate a page
morphic generate --page pricing

# Generate a component
morphic generate --component data-table

# See all available templates
morphic generate --list</code></pre>

    <h2>6. Sharing Context with AI/LLMs</h2>
    <p>Include <code>.morphic/context.json</code> in your LLM prompts. This ensures AI-generated code follows your design system:</p>
    <pre><code>"When generating UI code, follow these design tokens and rules:
[paste contents of .morphic/context.json]"</code></pre>
  `);
}

function generateTokensPage(ctx: MorphicContext): string {
  const colorSwatches = Object.entries(ctx.tokens.colors)
    .map(([name, value]) => {
      const textColor = isLight(value) ? '#000' : '#fff';
      return `<div class="swatch" style="background:${value};color:${textColor}">
        <span class="swatch-name">${name}</span>
        <span class="swatch-value">${value}</span>
      </div>`;
    }).join('\n');

  const spacingBlocks = ctx.tokens.spacing
    .filter(s => s > 0)
    .map(s => `<div class="spacing-row">
      <div class="spacing-block" style="width:${s}px;height:${s}px"></div>
      <span>${s}px</span>
    </div>`).join('\n');

  const typographySizes = Object.entries(ctx.tokens.typography.sizes)
    .map(([name, size]) => `<div class="type-sample" style="font-size:${size}">
      <span class="type-label">${name} (${size})</span>
      The quick brown fox jumps over the lazy dog
    </div>`).join('\n');

  const radiusSamples = Object.entries(ctx.tokens.radii)
    .map(([name, value]) => `<div class="radius-sample" style="border-radius:${value}">
      <span>${name}</span>
      <span class="radius-value">${value}</span>
    </div>`).join('\n');

  const shadowSamples = Object.entries(ctx.tokens.shadows)
    .map(([name, value]) => `<div class="shadow-sample" style="box-shadow:${value}">
      <span>${name}</span>
    </div>`).join('\n');

  return page('Design Tokens', 'tokens.html', `
    <h1>Design Tokens</h1>
    <p class="lead">The foundation of our design system. Use these tokens everywhere — never hardcode values.</p>

    <h2>Colors</h2>
    <div class="swatch-grid">${colorSwatches}</div>

    <h2>Spacing Scale</h2>
    <p>Use only these spacing values for padding, margin, and gap.</p>
    <div class="spacing-grid">${spacingBlocks}</div>
    <pre><code>Allowed values: ${ctx.tokens.spacing.join(', ')}px</code></pre>

    <h2>Typography</h2>
    <p>Font: <strong>${ctx.tokens.typography.fontFamily}</strong></p>
    <div class="type-grid">${typographySizes}</div>
    <h3>Font Weights</h3>
    <table>
      ${Object.entries(ctx.tokens.typography.weights).map(([name, weight]) => 
        `<tr><td><span style="font-weight:${weight}">${name} (${weight})</span></td><td>The quick brown fox</td></tr>`
      ).join('\n')}
    </table>

    <h2>Border Radius</h2>
    <div class="radius-grid">${radiusSamples}</div>

    <h2>Shadows</h2>
    <div class="shadow-grid">${shadowSamples}</div>

    <h2>Breakpoints</h2>
    <table>
      ${Object.entries(ctx.tokens.breakpoints).map(([name, value]) => 
        `<tr><td><strong>${name}</strong></td><td>${value}</td></tr>`
      ).join('\n')}
    </table>
  `);
}

function generateComponentsPage(ctx: MorphicContext): string {
  return page('Components', 'components.html', `
    <h1>Component Guidelines</h1>
    <p class="lead">How to build and use components consistently across the application.</p>

    <h2>Button</h2>
    <div class="component-demo">
      <div class="demo-preview">
        <button style="background:${ctx.tokens.colors.primary};color:white;padding:12px 24px;border:none;border-radius:8px;font-weight:600;cursor:pointer">Primary</button>
        <button style="background:transparent;color:#0f172a;padding:12px 24px;border:1px solid #e2e8f0;border-radius:8px;font-weight:600;cursor:pointer">Secondary</button>
        <button style="background:transparent;color:${ctx.tokens.colors.primary};padding:12px 24px;border:none;border-radius:8px;font-weight:600;cursor:pointer;text-decoration:underline">Ghost</button>
      </div>
      <pre><code>/* Primary action */
&lt;button className="bg-primary text-white px-6 py-3 rounded-lg font-semibold 
  hover:bg-primary-hover transition-colors"&gt;

/* Secondary action */
&lt;button className="border border-gray-300 px-6 py-3 rounded-lg font-semibold 
  hover:bg-gray-50 transition-colors"&gt;

/* Ghost/text action */
&lt;button className="text-primary px-6 py-3 rounded-lg font-semibold 
  hover:bg-blue-50 transition-colors underline"&gt;</code></pre>
    </div>
    <div class="guidelines">
      <h4>✅ Do</h4>
      <ul>
        <li>Use <strong>one primary button</strong> per visible area</li>
        <li>Include <code>aria-label</code> on icon-only buttons</li>
        <li>Minimum touch target: ${ctx.accessibility.minTouchTarget}</li>
        <li>Always show focus styles</li>
      </ul>
      <h4>❌ Don't</h4>
      <ul>
        <li>Don't use <code>&lt;div onClick&gt;</code> — use <code>&lt;button&gt;</code></li>
        <li>Don't disable buttons without explanation</li>
        <li>Don't use color alone to convey state</li>
      </ul>
    </div>

    <h2>Card</h2>
    <div class="component-demo">
      <div class="demo-preview">
        <div style="border:1px solid #e2e8f0;border-radius:12px;padding:24px;max-width:320px">
          <h3 style="font-size:1.25rem;font-weight:600;margin:0">Card Title</h3>
          <p style="color:#64748b;margin-top:8px;font-size:0.875rem">Card description with supporting text.</p>
        </div>
      </div>
      <pre><code>&lt;div className="rounded-xl border border-gray-200 p-6"&gt;
  &lt;h3 className="text-xl font-semibold"&gt;Title&lt;/h3&gt;
  &lt;p className="mt-2 text-sm text-gray-600"&gt;Description&lt;/p&gt;
&lt;/div&gt;</code></pre>
    </div>

    <h2>Form Input</h2>
    <div class="component-demo">
      <div class="demo-preview">
        <div style="max-width:320px">
          <label style="display:block;font-size:0.875rem;font-weight:500;color:#374151">Email</label>
          <input type="email" placeholder="you@example.com" style="margin-top:4px;width:100%;padding:8px 16px;border:1px solid #d1d5db;border-radius:8px;font-size:1rem">
        </div>
      </div>
      <pre><code>&lt;div&gt;
  &lt;label htmlFor="email" className="block text-sm font-medium text-gray-700"&gt;
    Email
  &lt;/label&gt;
  &lt;input 
    id="email" 
    type="email" 
    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2
      focus:border-primary focus:ring-primary"
  /&gt;
&lt;/div&gt;</code></pre>
    </div>
    <div class="guidelines">
      <h4>✅ Do</h4>
      <ul>
        <li>Always associate <code>&lt;label&gt;</code> with <code>htmlFor</code></li>
        <li>Use <code>required</code> and <code>aria-required</code> for required fields</li>
        <li>Show error messages with <code>aria-describedby</code></li>
      </ul>
      <h4>❌ Don't</h4>
      <ul>
        <li>Don't use placeholder as the only label</li>
        <li>Don't rely on color alone for error states</li>
      </ul>
    </div>

    <h2>Navigation</h2>
    <pre><code>&lt;nav className="border-b border-gray-200 bg-white" aria-label="Main navigation"&gt;
  &lt;div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4"&gt;
    &lt;a href="/" className="text-xl font-bold"&gt;Brand&lt;/a&gt;
    &lt;ul className="flex gap-8"&gt;
      &lt;li&gt;&lt;a href="/features" className="text-sm font-medium text-gray-600 hover:text-gray-900"&gt;Features&lt;/a&gt;&lt;/li&gt;
      &lt;li&gt;&lt;a href="/pricing" aria-current="page" className="text-sm font-medium text-primary"&gt;Pricing&lt;/a&gt;&lt;/li&gt;
    &lt;/ul&gt;
  &lt;/div&gt;
&lt;/nav&gt;</code></pre>

    <h2>Component Naming</h2>
    <table>
      <tr><td><strong>Convention</strong></td><td>${ctx.patterns.namingConvention}</td></tr>
      <tr><td><strong>Extension</strong></td><td>${ctx.patterns.fileExtension}</td></tr>
      <tr><td><strong>Directory</strong></td><td>${ctx.patterns.componentDir}</td></tr>
    </table>
  `);
}

function generatePatternsPage(ctx: MorphicContext): string {
  return page('Patterns', 'patterns.html', `
    <h1>Layout Patterns</h1>
    <p class="lead">Reusable layout patterns for common page structures.</p>

    <h2>Page Layout</h2>
    <pre><code>/* Standard page layout */
&lt;main className="min-h-screen"&gt;
  &lt;section className="mx-auto max-w-7xl px-4 py-24"&gt;
    {/* Content */}
  &lt;/section&gt;
&lt;/main&gt;</code></pre>

    <h2>Content Width</h2>
    <table>
      <tr><td><strong>Narrow</strong></td><td><code>max-w-2xl</code> (672px)</td><td>Forms, auth pages, articles</td></tr>
      <tr><td><strong>Medium</strong></td><td><code>max-w-4xl</code> (896px)</td><td>Settings, detail pages</td></tr>
      <tr><td><strong>Wide</strong></td><td><code>max-w-7xl</code> (1280px)</td><td>Dashboards, landing pages</td></tr>
    </table>

    <h2>Grid Patterns</h2>
    <pre><code>/* Feature grid — 3 columns */
&lt;div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"&gt;

/* Pricing grid — 3 equal columns */
&lt;div className="grid gap-8 lg:grid-cols-3"&gt;

/* Dashboard — main + sidebar */
&lt;div className="grid gap-8 lg:grid-cols-3"&gt;
  &lt;section className="lg:col-span-2"&gt;{/* Main */}&lt;/section&gt;
  &lt;aside&gt;{/* Sidebar */}&lt;/aside&gt;
&lt;/div&gt;

/* Stats row — 4 columns */
&lt;div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"&gt;</code></pre>

    <h2>Spacing Patterns</h2>
    <table>
      <tr><td><strong>Between sections</strong></td><td><code>py-24</code> (96px)</td></tr>
      <tr><td><strong>Section to heading</strong></td><td><code>mb-16</code> (64px)</td></tr>
      <tr><td><strong>Between cards</strong></td><td><code>gap-8</code> (32px)</td></tr>
      <tr><td><strong>Inside cards</strong></td><td><code>p-6</code> or <code>p-8</code></td></tr>
      <tr><td><strong>Between form fields</strong></td><td><code>space-y-6</code> (24px)</td></tr>
      <tr><td><strong>Text spacing</strong></td><td><code>mt-2</code> to <code>mt-4</code></td></tr>
    </table>

    <h2>Hero Pattern</h2>
    <pre><code>&lt;section className="flex flex-col items-center px-4 py-24 text-center"&gt;
  &lt;h1 className="max-w-3xl text-5xl font-bold tracking-tight"&gt;Headline&lt;/h1&gt;
  &lt;p className="mt-6 max-w-2xl text-lg text-gray-600"&gt;Subheading&lt;/p&gt;
  &lt;div className="mt-10 flex gap-4"&gt;
    &lt;button&gt;Primary CTA&lt;/button&gt;
    &lt;button&gt;Secondary CTA&lt;/button&gt;
  &lt;/div&gt;
&lt;/section&gt;</code></pre>

    <h2>Page Templates Available</h2>
    <pre><code># Generate any of these:
morphic generate --page landing
morphic generate --page pricing
morphic generate --page dashboard
morphic generate --page settings
morphic generate --page auth
morphic generate --page 404</code></pre>
  `);
}

function generateAccessibilityPage(ctx: MorphicContext): string {
  return page('Accessibility', 'accessibility.html', `
    <h1>Accessibility Standards</h1>
    <p class="lead">We target <strong>WCAG ${ctx.accessibility.level}</strong> compliance. Accessibility is not optional.</p>

    <h2>Requirements</h2>
    <table>
      <tr><td><strong>WCAG Level</strong></td><td>${ctx.accessibility.level}</td></tr>
      <tr><td><strong>Min Contrast (text)</strong></td><td>${ctx.accessibility.minContrast}:1</td></tr>
      <tr><td><strong>Min Touch Target</strong></td><td>${ctx.accessibility.minTouchTarget}</td></tr>
      <tr><td><strong>Alt Text Required</strong></td><td>${ctx.accessibility.requireAltText ? '✅ Yes' : '❌ No'}</td></tr>
      <tr><td><strong>ARIA Labels Required</strong></td><td>${ctx.accessibility.requireAriaLabels ? '✅ Yes' : '❌ No'}</td></tr>
    </table>

    <h2>Color Contrast</h2>
    <p>All text must meet minimum contrast ratios against its background:</p>
    <ul>
      <li><strong>Normal text:</strong> ${ctx.accessibility.minContrast}:1 minimum</li>
      <li><strong>Large text (18px+ or 14px+ bold):</strong> 3:1 minimum</li>
      <li><strong>UI components:</strong> 3:1 minimum</li>
    </ul>
    <pre><code>/* ✅ Do — Sufficient contrast */
&lt;p className="text-gray-700"&gt;  /* ~7:1 on white */

/* ❌ Don't — Low contrast */
&lt;p className="text-gray-400"&gt;  /* ~3.5:1 on white — fails AA for normal text */</code></pre>

    <h2>Keyboard Navigation</h2>
    <ul>
      <li>All interactive elements must be keyboard accessible</li>
      <li>Focus order must follow visual layout</li>
      <li>Focus styles must be visible</li>
      <li>Modals must trap focus</li>
      <li><code>Escape</code> should close modals, dropdowns, popovers</li>
    </ul>
    <pre><code>/* Always include focus styles */
&lt;button className="focus-visible:outline focus-visible:outline-2 
  focus-visible:outline-offset-2 focus-visible:outline-primary"&gt;</code></pre>

    <h2>Images & Media</h2>
    <pre><code>/* ✅ Informative image — descriptive alt */
&lt;img src="chart.png" alt="Revenue grew 45% from Q1 to Q3 2024" /&gt;

/* ✅ Decorative image — empty alt */
&lt;img src="decoration.svg" alt="" aria-hidden="true" /&gt;

/* ❌ Never — missing alt */
&lt;img src="photo.jpg" /&gt;</code></pre>

    <h2>Semantic HTML</h2>
    <pre><code>/* ✅ Do — Semantic elements */
&lt;nav aria-label="Main navigation"&gt;
&lt;main&gt;
&lt;section aria-labelledby="features-heading"&gt;
&lt;article&gt;
&lt;aside aria-labelledby="sidebar-heading"&gt;
&lt;footer&gt;

/* ❌ Don't — div soup */
&lt;div class="nav"&gt;
&lt;div class="main"&gt;
&lt;div class="section"&gt;</code></pre>

    <h2>Forms</h2>
    <pre><code>/* ✅ Do */
&lt;label htmlFor="email"&gt;Email&lt;/label&gt;
&lt;input id="email" type="email" aria-required="true" 
  aria-describedby="email-error" /&gt;
&lt;span id="email-error" role="alert"&gt;Please enter a valid email&lt;/span&gt;

/* ❌ Don't */
&lt;input placeholder="Email" /&gt;  /* No label, no error association */</code></pre>

    <h2>ARIA Landmarks</h2>
    <table>
      <tr><td><code>&lt;nav&gt;</code></td><td>Add <code>aria-label</code> to distinguish multiple navs</td></tr>
      <tr><td><code>&lt;main&gt;</code></td><td>One per page</td></tr>
      <tr><td><code>&lt;section&gt;</code></td><td>Use <code>aria-labelledby</code> pointing to heading</td></tr>
      <tr><td><code>&lt;form&gt;</code></td><td>Add <code>aria-label</code> describing the form's purpose</td></tr>
    </table>

    <h2>Testing</h2>
    <pre><code># Run Morphic accessibility lint
morphic lint ./src

# Manual testing checklist:
# 1. Tab through the entire page — can you reach everything?
# 2. Use screen reader (VoiceOver/NVDA) — does it make sense?
# 3. Zoom to 200% — is everything still usable?
# 4. Check with browser color blindness simulator</code></pre>
  `);
}

function generateGuidelinesPage(ctx: MorphicContext): string {
  const rules = ctx.rules.map((rule, i) => `<li><code>Rule ${i + 1}</code> ${rule}</li>`).join('\n');

  return page('Guidelines', 'guidelines.html', `
    <h1>Development Guidelines</h1>
    <p class="lead">${ctx.rules.length} rules to ensure consistent, maintainable code.</p>

    <h2>Rules</h2>
    <ol class="rules-list">${rules}</ol>

    <h2>File Organization</h2>
    <pre><code>${ctx.patterns.componentDir}/
├── Button.tsx          # Component file (${ctx.patterns.namingConvention})
├── DataTable.tsx
├── Form.tsx
└── Navigation.tsx

${ctx.patterns.pageDir}/
├── HomePage.tsx
├── PricingPage.tsx
└── DashboardPage.tsx</code></pre>

    <h2>Component Structure</h2>
    <pre><code>// Standard component template
import React from 'react';

interface MyComponentProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export default function MyComponent({ title, description, children }: MyComponentProps) {
  return (
    &lt;div className="rounded-xl border border-gray-200 p-6"&gt;
      &lt;h3 className="text-xl font-semibold"&gt;{title}&lt;/h3&gt;
      {description && &lt;p className="mt-2 text-gray-600"&gt;{description}&lt;/p&gt;}
      {children}
    &lt;/div&gt;
  );
}</code></pre>

    <h2>CSS Rules</h2>
    <ul>
      <li>Use design tokens — never hardcode colors, spacing, or typography</li>
      <li>Use utility classes (Tailwind) or CSS modules — no inline styles</li>
      <li>Use <code>gap</code> for spacing between siblings, not <code>margin</code></li>
      <li>Use responsive prefixes: <code>sm:</code> <code>md:</code> <code>lg:</code></li>
    </ul>

    <h2>Git Commit Convention</h2>
    <pre><code>feat: add pricing page component
fix: correct button contrast ratio
docs: update token documentation
refactor: extract card component
a11y: add aria-labels to navigation</code></pre>

    <h2>LLM Integration</h2>
    <p>When using AI to generate code, include <code>.morphic/context.json</code> in your prompt:</p>
    <pre><code>Prompt template:

"Generate a [component/page] following these design system rules:

Stack: ${ctx.stack.framework} + ${ctx.stack.ui}
Accessibility: WCAG ${ctx.accessibility.level}

Design tokens: [paste from .morphic/context.json]

Rules:
${ctx.rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Generate the component now."</code></pre>
  `);
}

function generateCSS(ctx: MorphicContext): string {
  return `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: ${ctx.tokens.typography.fontFamily}; color: #0f172a; display: flex; min-height: 100vh; }
.sidebar { width: 260px; background: #0f172a; color: #e2e8f0; padding: 24px 0; position: fixed; height: 100vh; overflow-y: auto; }
.sidebar-brand { padding: 0 24px 24px; font-size: 1.25rem; font-weight: 700; border-bottom: 1px solid #1e293b; margin-bottom: 12px; }
.sidebar a { display: block; padding: 10px 24px; color: #94a3b8; text-decoration: none; font-size: 0.875rem; font-weight: 500; transition: all 0.15s; }
.sidebar a:hover { color: #f1f5f9; background: #1e293b; }
.sidebar a.active { color: #fff; background: ${ctx.tokens.colors.primary}; }
.content { margin-left: 260px; padding: 48px; max-width: 900px; flex: 1; }
h1 { font-size: 2.25rem; font-weight: 700; margin-bottom: 16px; }
h2 { font-size: 1.5rem; font-weight: 700; margin-top: 48px; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
h3 { font-size: 1.125rem; font-weight: 600; margin-top: 24px; margin-bottom: 8px; }
h4 { font-size: 1rem; font-weight: 600; margin-top: 16px; margin-bottom: 8px; }
p { line-height: 1.7; margin-bottom: 12px; }
.lead { font-size: 1.125rem; color: #64748b; margin-bottom: 32px; }
pre { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; overflow-x: auto; font-size: 0.875rem; line-height: 1.6; }
code { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.875em; }
p code, li code, td code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
table { width: 100%; border-collapse: collapse; margin: 16px 0; }
td, th { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e2e8f0; }
ul, ol { margin: 12px 0; padding-left: 24px; }
li { margin-bottom: 8px; line-height: 1.6; }
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin: 24px 0; }
.card { display: block; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; text-decoration: none; color: inherit; transition: all 0.15s; }
.card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-color: ${ctx.tokens.colors.primary}; }
.card h3 { margin: 0 0 8px; }
.card p { color: #64748b; margin: 0; font-size: 0.875rem; }
.swatch-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin: 16px 0; }
.swatch { padding: 16px; border-radius: 8px; font-size: 0.75rem; min-height: 80px; display: flex; flex-direction: column; justify-content: flex-end; }
.swatch-name { font-weight: 600; }
.swatch-value { opacity: 0.8; margin-top: 2px; }
.spacing-grid { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-end; margin: 16px 0; }
.spacing-row { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.spacing-block { background: ${ctx.tokens.colors.primary}; border-radius: 4px; min-width: 4px; min-height: 4px; }
.spacing-row span { font-size: 0.75rem; color: #64748b; }
.type-grid { margin: 16px 0; }
.type-sample { margin: 12px 0; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
.type-label { display: block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 4px; }
.radius-grid { display: flex; flex-wrap: wrap; gap: 16px; margin: 16px 0; }
.radius-sample { width: 80px; height: 80px; border: 2px solid ${ctx.tokens.colors.primary}; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 600; }
.radius-value { color: #64748b; font-weight: 400; }
.shadow-grid { display: flex; flex-wrap: wrap; gap: 24px; margin: 16px 0; }
.shadow-sample { width: 120px; height: 80px; background: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; font-weight: 500; }
.component-demo { margin: 16px 0; }
.demo-preview { padding: 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px 8px 0 0; display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.demo-preview + pre { border-radius: 0 0 8px 8px; margin-top: 0; border-top: 0; }
.guidelines { background: #f8fafc; border-radius: 8px; padding: 16px 24px; margin: 16px 0; }
.guidelines h4 { margin-top: 8px; }
.rules-list li { padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
.rules-list code { font-weight: 700; color: ${ctx.tokens.colors.primary}; }
@media (max-width: 768px) {
  .sidebar { display: none; }
  .content { margin-left: 0; padding: 24px; }
}`;
}

// Helper
function isLight(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

function writeFile(dir: string, filePath: string, content: string): void {
  const fullPath = path.join(dir, filePath);
  fs.writeFileSync(fullPath, content);
}
