import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { DEFAULT_CONTEXT } from '../init/defaults';

export async function createProject(name: string, opts: { template?: string; skip?: boolean }): Promise<void> {
  const projectDir = path.resolve(process.cwd(), name);
  const template = opts.template || 'nextjs-tailwind';

  console.log(chalk.bold(`\n🎯 Morphic — Creating project "${name}"\n`));
  console.log(chalk.gray(`  Template: ${template}`));
  console.log(chalk.gray(`  Directory: ${projectDir}\n`));

  if (fs.existsSync(projectDir)) {
    console.log(chalk.red(`❌ Directory "${name}" already exists.\n`));
    process.exit(1);
  }

  // Create project directory
  fs.mkdirSync(projectDir, { recursive: true });

  if (template === 'nextjs-tailwind') {
    createNextjsTailwind(projectDir, name);
  } else if (template === 'react-tailwind') {
    createReactTailwind(projectDir, name);
  } else {
    console.log(chalk.red(`❌ Unknown template: ${template}`));
    console.log(chalk.gray('Available: nextjs-tailwind, react-tailwind\n'));
    process.exit(1);
  }

  // Create .morphic context
  const morphicDir = path.join(projectDir, '.morphic');
  fs.mkdirSync(morphicDir, { recursive: true });
  fs.writeFileSync(
    path.join(morphicDir, 'context.json'),
    JSON.stringify(DEFAULT_CONTEXT, null, 2) + '\n'
  );

  // Install dependencies
  if (!opts.skip) {
    console.log(chalk.cyan('\n📦 Installing dependencies...\n'));
    try {
      execSync('npm install', { cwd: projectDir, stdio: 'inherit' });
    } catch {
      console.log(chalk.yellow('\n⚠️  npm install failed. Run it manually:\n'));
      console.log(chalk.gray(`  cd ${name} && npm install\n`));
    }
  }

  console.log(chalk.bold.green(`\n✅ Project "${name}" created!\n`));
  console.log('Next steps:');
  console.log(chalk.cyan(`  cd ${name}`));
  if (opts.skip) console.log(chalk.cyan('  npm install'));
  console.log(chalk.cyan('  npm run dev'));
  console.log(chalk.gray(`\n  Then open http://localhost:3000\n`));
  console.log('Morphic commands:');
  console.log(chalk.gray('  morphic generate --page pricing    Add a pricing page'));
  console.log(chalk.gray('  morphic generate --component form  Add a form component'));
  console.log(chalk.gray('  morphic lint ./src                 Check design consistency'));
  console.log(chalk.gray('  morphic context --show             View design tokens\n'));
}

function createNextjsTailwind(dir: string, name: string): void {
  // package.json
  writeFile(dir, 'package.json', JSON.stringify({
    name,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'morphic lint ./src',
    },
    dependencies: {
      next: '^14.2.0',
      react: '^18.3.0',
      'react-dom': '^18.3.0',
    },
    devDependencies: {
      '@types/node': '^20.0.0',
      '@types/react': '^18.3.0',
      '@types/react-dom': '^18.3.0',
      autoprefixer: '^10.4.0',
      postcss: '^8.4.0',
      tailwindcss: '^3.4.0',
      typescript: '^5.3.0',
    },
  }, null, 2));

  // tsconfig.json
  writeFile(dir, 'tsconfig.json', JSON.stringify({
    compilerOptions: {
      target: 'es5',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [{ name: 'next' }],
      paths: { '@/*': ['./src/*'] },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  }, null, 2));

  // next.config.js
  writeFile(dir, 'next.config.js', `/** @type {import('next').NextConfig} */
const nextConfig = {};
module.exports = nextConfig;
`);

  // postcss.config.js
  writeFile(dir, 'postcss.config.js', `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`);

  // tailwind.config.ts
  writeFile(dir, 'tailwind.config.ts', `import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        "primary-hover": "#1D4ED8",
        secondary: "#64748B",
        "secondary-hover": "#475569",
      },
    },
  },
  plugins: [],
};
export default config;
`);

  // .gitignore
  writeFile(dir, '.gitignore', `node_modules/
.next/
out/
dist/
.morphic/reports/
.DS_Store
*.tsbuildinfo
next-env.d.ts
`);

  // src/app/layout.tsx
  mkdirp(dir, 'src/app');
  writeFile(dir, 'src/app/globals.css', `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground: #0f172a;
  --background: #ffffff;
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: Inter, system-ui, sans-serif;
}
`);

  writeFile(dir, 'src/app/layout.tsx', `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "${name}",
  description: "Built with Morphic UI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
`);

  // src/app/page.tsx — Landing page
  writeFile(dir, 'src/app/page.tsx', `export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-4 py-24 text-center">
        <span className="mb-4 inline-block rounded-full bg-blue-100 px-4 py-1.5 text-sm font-semibold text-primary">
          Built with Morphic
        </span>
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl">
          Ship beautiful UIs
          <span className="text-primary"> faster</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-gray-600">
          AI-powered design guardrails ensure consistency, accessibility, and best practices across your entire codebase.
        </p>
        <div className="mt-10 flex gap-4">
          <a
            href="/pricing"
            className="rounded-lg bg-primary px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors"
          >
            Get Started
          </a>
          <a
            href="/dashboard"
            className="rounded-lg border border-gray-300 px-6 py-3 text-base font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
          >
            View Demo
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-24" aria-labelledby="features-heading">
        <h2 id="features-heading" className="text-center text-3xl font-bold">
          Everything you need
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-gray-600">
          Morphic provides guardrails so LLMs generate consistent, accessible UI code every time.
        </p>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "Design Lint", desc: "Catch hardcoded colors, spacing issues, and accessibility violations automatically.", icon: "🔍" },
            { title: "Code Generation", desc: "Generate pages and components that follow your design system perfectly.", icon: "⚡" },
            { title: "Visual Validation", desc: "Render and analyze your UI across viewports to catch visual bugs.", icon: "👁️" },
            { title: "Design Tokens", desc: "Centralized tokens ensure consistency across your entire application.", icon: "🎨" },
            { title: "Accessibility", desc: "WCAG compliance built-in — every component meets AA standards.", icon: "♿" },
            { title: "Any Framework", desc: "Works with React, Next.js, Vue, Svelte, and any CSS approach.", icon: "🔌" },
          ].map((feature) => (
            <div key={feature.title} className="rounded-xl border border-gray-200 p-8 hover:shadow-md transition-shadow">
              <span className="text-3xl" aria-hidden="true">{feature.icon}</span>
              <h3 className="mt-4 text-xl font-semibold">{feature.title}</h3>
              <p className="mt-2 text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary px-4 py-24 text-center text-white">
        <h2 className="text-3xl font-bold">Ready to ship?</h2>
        <p className="mx-auto mt-4 max-w-xl text-blue-100">
          Start building with confidence. Morphic ensures every pixel is intentional.
        </p>
        <a
          href="/pricing"
          className="mt-8 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-primary hover:bg-blue-50 transition-colors"
        >
          View Pricing
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 px-4 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="font-semibold">${name}</p>
          <p className="text-sm text-gray-500">Built with Morphic UI · © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </main>
  );
}
`);

  // src/app/pricing/page.tsx
  mkdirp(dir, 'src/app/pricing');
  writeFile(dir, 'src/app/pricing/page.tsx', `const plans = [
  {
    name: "Starter",
    price: "$9",
    description: "Perfect for individuals",
    features: ["1 project", "5GB storage", "Email support", "Basic analytics"],
    cta: "Start Free Trial",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    description: "Best for growing teams",
    features: ["10 projects", "50GB storage", "Priority support", "API access", "Advanced analytics", "Custom integrations"],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "$99",
    description: "For large organizations",
    features: ["Unlimited projects", "500GB storage", "24/7 support", "API access", "SSO", "Custom integrations", "Dedicated manager", "SLA guarantee"],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen px-4 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Simple, Transparent Pricing</h1>
          <p className="mt-4 text-lg text-gray-600">Choose the plan that fits your needs. No hidden fees.</p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={\`flex flex-col rounded-2xl border p-8 \${
                plan.highlighted
                  ? "border-primary ring-2 ring-primary shadow-lg scale-105"
                  : "border-gray-200"
              }\`}
            >
              {plan.highlighted && (
                <span className="mb-4 inline-block self-start rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-primary">
                  Most Popular
                </span>
              )}
              <h2 className="text-2xl font-bold">{plan.name}</h2>
              <p className="mt-2 text-gray-600">{plan.description}</p>
              <p className="mt-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-gray-500">/month</span>
              </p>
              <ul className="mt-8 flex-1 space-y-3" role="list">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <span className="text-green-500" aria-hidden="true">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                className={\`mt-8 w-full rounded-lg px-4 py-3 text-center font-semibold transition-colors \${
                  plan.highlighted
                    ? "bg-primary text-white hover:bg-primary-hover"
                    : "border border-gray-300 text-gray-900 hover:bg-gray-50"
                }\`}
                aria-label={\`\${plan.cta} for \${plan.name} plan\`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
`);

  // src/app/dashboard/page.tsx
  mkdirp(dir, 'src/app/dashboard');
  writeFile(dir, 'src/app/dashboard/page.tsx', `export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white px-4 py-4" aria-label="Main navigation">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span className="text-xl font-bold">Dashboard</span>
          <div className="flex items-center gap-4">
            <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">
              Settings
            </button>
            <div className="h-8 w-8 rounded-full bg-primary" aria-label="User avatar" />
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Stats */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Users", value: "12,345", change: "+12%" },
            { label: "Revenue", value: "$45,678", change: "+8%" },
            { label: "Active Projects", value: "89", change: "+3%" },
            { label: "Conversion", value: "3.2%", change: "+0.4%" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-6">
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="mt-2 text-3xl font-bold">{stat.value}</p>
              <p className="mt-1 text-sm text-green-600">{stat.change} from last month</p>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <section className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6" aria-labelledby="activity-heading">
            <h2 id="activity-heading" className="text-lg font-semibold">Recent Activity</h2>
            <div className="mt-6 space-y-4">
              {["New user signed up", "Payment received — $29", "Project deployed", "Support ticket resolved"].map(
                (item, i) => (
                  <div key={i} className="flex items-center gap-4 border-b border-gray-100 pb-4 last:border-0">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <p className="text-sm text-gray-700">{item}</p>
                    <span className="ml-auto text-xs text-gray-400">{i + 1}h ago</span>
                  </div>
                )
              )}
            </div>
          </section>
          <aside className="rounded-xl border border-gray-200 bg-white p-6" aria-labelledby="actions-heading">
            <h2 id="actions-heading" className="text-lg font-semibold">Quick Actions</h2>
            <div className="mt-6 space-y-3">
              {["Create Project", "Invite Team", "View Reports", "Export Data"].map((action) => (
                <button
                  key={action}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-left text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
`);

  console.log(chalk.green('  ✅ Created Next.js + Tailwind project'));
  console.log(chalk.gray('     Pages: Home, Pricing, Dashboard'));
  console.log(chalk.gray('     Design tokens configured in tailwind.config.ts'));
  console.log(chalk.gray('     Morphic context in .morphic/context.json'));
}

function createReactTailwind(dir: string, name: string): void {
  // Simpler Vite-based React project
  writeFile(dir, 'package.json', JSON.stringify({
    name,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'tsc && vite build',
      preview: 'vite preview',
      lint: 'morphic lint ./src',
    },
    dependencies: {
      react: '^18.3.0',
      'react-dom': '^18.3.0',
    },
    devDependencies: {
      '@types/react': '^18.3.0',
      '@types/react-dom': '^18.3.0',
      '@vitejs/plugin-react': '^4.0.0',
      autoprefixer: '^10.4.0',
      postcss: '^8.4.0',
      tailwindcss: '^3.4.0',
      typescript: '^5.3.0',
      vite: '^5.0.0',
    },
  }, null, 2));

  writeFile(dir, 'index.html', `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`);

  mkdirp(dir, 'src');
  writeFile(dir, 'src/main.tsx', `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`);

  writeFile(dir, 'src/index.css', `@tailwind base;
@tailwind components;
@tailwind utilities;
`);

  writeFile(dir, 'src/App.tsx', `export default function App() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Welcome to ${name}</h1>
        <p className="mt-4 text-gray-600">Built with Morphic UI</p>
      </div>
    </main>
  );
}
`);

  writeFile(dir, 'vite.config.ts', `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`);

  writeFile(dir, 'tailwind.config.ts', `import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        "primary-hover": "#1D4ED8",
        secondary: "#64748B",
      },
    },
  },
  plugins: [],
};
export default config;
`);

  writeFile(dir, 'postcss.config.js', `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`);

  writeFile(dir, 'tsconfig.json', JSON.stringify({
    compilerOptions: {
      target: 'ES2020',
      useDefineForClassFields: true,
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      skipLibCheck: true,
      moduleResolution: 'bundler',
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: 'react-jsx',
      strict: true,
    },
    include: ['src'],
  }, null, 2));

  writeFile(dir, '.gitignore', 'node_modules/\ndist/\n.morphic/reports/\n');

  console.log(chalk.green('  ✅ Created React + Vite + Tailwind project'));
}

// Helpers
function writeFile(dir: string, filePath: string, content: string): void {
  const fullPath = path.join(dir, filePath);
  const fileDir = path.dirname(fullPath);
  if (!fs.existsSync(fileDir)) fs.mkdirSync(fileDir, { recursive: true });
  fs.writeFileSync(fullPath, content);
}

function mkdirp(dir: string, sub: string): void {
  const fullPath = path.join(dir, sub);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
}
