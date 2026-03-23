import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { loadContext } from '../init/wizard';

const PAGE_TEMPLATES: Record<string, (stack: string) => string> = {
  landing: (stack) => generateLandingPage(stack),
  pricing: (stack) => generatePricingPage(stack),
  dashboard: (stack) => generateDashboardPage(stack),
  settings: (stack) => generateSettingsPage(stack),
  auth: (stack) => generateAuthPage(stack),
  '404': (stack) => generate404Page(stack),
};

const COMPONENT_TEMPLATES: Record<string, (stack: string) => string> = {
  form: (stack) => generateFormComponent(stack),
  'data-table': (stack) => generateDataTableComponent(stack),
  'card-grid': (stack) => generateCardGridComponent(stack),
  navigation: (stack) => generateNavigationComponent(stack),
  hero: (stack) => generateHeroComponent(stack),
};

function getStackKey(context: any): string {
  if (!context) return 'react-tailwind';
  return `${context.stack?.framework || 'react'}-${context.stack?.ui || 'tailwind'}`;
}

export async function generate(opts: { page?: string; component?: string; list?: boolean; output?: string }): Promise<void> {
  const context = loadContext();

  if (opts.list) {
    console.log(chalk.bold('\n📋 Available Templates\n'));
    console.log(chalk.cyan('Pages:'));
    Object.keys(PAGE_TEMPLATES).forEach(t => console.log(`  • ${t}`));
    console.log(chalk.cyan('\nComponents:'));
    Object.keys(COMPONENT_TEMPLATES).forEach(t => console.log(`  • ${t}`));
    console.log('');
    return;
  }

  const stack = getStackKey(context);
  const outputDir = opts.output || './src';

  if (opts.page) {
    const template = PAGE_TEMPLATES[opts.page];
    if (!template) {
      console.log(chalk.red(`\n❌ Unknown page type: ${opts.page}`));
      console.log(`Available: ${Object.keys(PAGE_TEMPLATES).join(', ')}\n`);
      return;
    }

    const pageName = opts.page.charAt(0).toUpperCase() + opts.page.slice(1);
    const dir = path.resolve(outputDir, 'pages');
    const filePath = path.join(dir, `${pageName}Page.tsx`);

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, template(stack));
    console.log(chalk.green(`\n✅ Generated ${path.relative(process.cwd(), filePath)}`));
    console.log(chalk.gray(`   Stack: ${stack}\n`));
  }

  if (opts.component) {
    const template = COMPONENT_TEMPLATES[opts.component];
    if (!template) {
      console.log(chalk.red(`\n❌ Unknown component type: ${opts.component}`));
      console.log(`Available: ${Object.keys(COMPONENT_TEMPLATES).join(', ')}\n`);
      return;
    }

    const compName = opts.component.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    const dir = path.resolve(outputDir, 'components');
    const filePath = path.join(dir, `${compName}.tsx`);

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, template(stack));
    console.log(chalk.green(`\n✅ Generated ${path.relative(process.cwd(), filePath)}`));
    console.log(chalk.gray(`   Stack: ${stack}\n`));
  }

  if (!opts.page && !opts.component && !opts.list) {
    console.log(chalk.yellow('\nSpecify --page <type>, --component <type>, or --list'));
    console.log(chalk.gray('Example: morphic generate --page pricing\n'));
  }
}

// Template generators
function generateLandingPage(stack: string): string {
  return `import React from 'react';

interface LandingPageProps {
  title?: string;
  subtitle?: string;
}

export default function LandingPage({ 
  title = "Welcome to Our Product",
  subtitle = "The best solution for your needs" 
}: LandingPageProps) {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-gray-600">
          {subtitle}
        </p>
        <div className="mt-10 flex gap-4">
          <button
            className="rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            aria-label="Get started with our product"
          >
            Get Started
          </button>
          <button
            className="rounded-lg border border-gray-300 px-6 py-3 text-base font-semibold text-gray-900 hover:bg-gray-50"
            aria-label="Learn more about our product"
          >
            Learn More
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-7xl px-4 py-24" aria-labelledby="features-heading">
        <h2 id="features-heading" className="text-center text-3xl font-bold">
          Features
        </h2>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-gray-200 p-8">
              <h3 className="text-xl font-semibold">Feature {i}</h3>
              <p className="mt-4 text-gray-600">
                Description of feature {i} and how it helps users.
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
`;
}

function generatePricingPage(stack: string): string {
  return `import React from 'react';

interface Plan {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

const defaultPlans: Plan[] = [
  {
    name: 'Starter',
    price: '$9',
    description: 'Perfect for individuals',
    features: ['1 project', '5GB storage', 'Email support'],
    cta: 'Start Free Trial',
  },
  {
    name: 'Pro',
    price: '$29',
    description: 'Best for growing teams',
    features: ['10 projects', '50GB storage', 'Priority support', 'API access'],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    description: 'For large organizations',
    features: ['Unlimited projects', '500GB storage', '24/7 support', 'API access', 'SSO', 'Custom integrations'],
    cta: 'Contact Sales',
  },
];

interface PricingPageProps {
  plans?: Plan[];
}

export default function PricingPage({ plans = defaultPlans }: PricingPageProps) {
  return (
    <main className="min-h-screen px-4 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Simple, Transparent Pricing</h1>
          <p className="mt-4 text-lg text-gray-600">
            Choose the plan that fits your needs
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={\`rounded-2xl border p-8 \${
                plan.highlighted
                  ? 'border-blue-600 ring-2 ring-blue-600 shadow-lg'
                  : 'border-gray-200'
              }\`}
            >
              {plan.highlighted && (
                <span className="mb-4 inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-600">
                  Most Popular
                </span>
              )}
              <h2 className="text-2xl font-bold">{plan.name}</h2>
              <p className="mt-2 text-gray-600">{plan.description}</p>
              <p className="mt-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-gray-500">/month</span>
              </p>
              <ul className="mt-8 space-y-3" role="list">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <span className="text-green-500" aria-hidden="true">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                className={\`mt-8 w-full rounded-lg px-4 py-3 text-center font-semibold \${
                  plan.highlighted
                    ? 'bg-blue-600 text-white hover:bg-blue-500'
                    : 'border border-gray-300 text-gray-900 hover:bg-gray-50'
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
`;
}

function generateDashboardPage(stack: string): string {
  return `import React from 'react';

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        
        {/* Stats Grid */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {['Total Users', 'Revenue', 'Active Projects', 'Conversion Rate'].map((stat) => (
            <div key={stat} className="rounded-xl border border-gray-200 bg-white p-6">
              <p className="text-sm font-medium text-gray-500">{stat}</p>
              <p className="mt-2 text-3xl font-bold">—</p>
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <section className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6" aria-labelledby="activity-heading">
            <h2 id="activity-heading" className="text-lg font-semibold">Recent Activity</h2>
            <div className="mt-4 text-gray-500">Activity content here</div>
          </section>
          <aside className="rounded-xl border border-gray-200 bg-white p-6" aria-labelledby="sidebar-heading">
            <h2 id="sidebar-heading" className="text-lg font-semibold">Quick Actions</h2>
            <div className="mt-4 text-gray-500">Sidebar content here</div>
          </aside>
        </div>
      </div>
    </main>
  );
}
`;
}

function generateSettingsPage(stack: string): string {
  return `import React from 'react';

export default function SettingsPage() {
  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold">Settings</h1>

        <form className="mt-8 space-y-8" aria-label="Account settings">
          {/* Profile Section */}
          <section className="rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold">Profile</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                <input id="firstName" type="text" className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2" />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                <input id="lastName" type="text" className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input id="email" type="email" className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2" />
              </div>
            </div>
          </section>

          {/* Notifications Section */}
          <section className="rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold">Notifications</h2>
            <div className="mt-6 space-y-4">
              {['Email notifications', 'Push notifications', 'Weekly digest'].map((label) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{label}</span>
                  <button type="button" role="switch" aria-checked="false" aria-label={\`Toggle \${label}\`}
                    className="relative h-6 w-11 rounded-full bg-gray-200">
                    <span className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <div className="flex justify-end gap-4">
            <button type="button" className="rounded-lg border border-gray-300 px-4 py-2 font-medium">Cancel</button>
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500">Save Changes</button>
          </div>
        </form>
      </div>
    </main>
  );
}
`;
}

function generateAuthPage(stack: string): string {
  return `import React from 'react';

export default function AuthPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-bold">Sign In</h1>
        <p className="mt-2 text-center text-gray-600">Welcome back</p>

        <form className="mt-8 space-y-6" aria-label="Sign in form">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input id="email" type="email" required autoComplete="email"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input id="password" type="password" required autoComplete="current-password"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded border-gray-300" />
              <span className="text-sm text-gray-600">Remember me</span>
            </label>
            <a href="#" className="text-sm text-blue-600 hover:text-blue-500">Forgot password?</a>
          </div>
          <button type="submit" className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-500">
            Sign In
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account? <a href="#" className="text-blue-600 hover:text-blue-500">Sign up</a>
        </p>
      </div>
    </main>
  );
}
`;
}

function generate404Page(stack: string): string {
  return `import React from 'react';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-blue-600">404</p>
      <h1 className="mt-4 text-3xl font-bold">Page Not Found</h1>
      <p className="mt-4 max-w-md text-gray-600">
        Sorry, we couldn't find the page you're looking for.
      </p>
      <a href="/" className="mt-8 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500"
        aria-label="Go back to homepage">
        Go Home
      </a>
    </main>
  );
}
`;
}

function generateFormComponent(stack: string): string {
  return `import React, { FormEvent, useState } from 'react';

interface Field {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}

interface FormProps {
  fields: Field[];
  onSubmit: (data: Record<string, string>) => void;
  submitLabel?: string;
}

export default function Form({ fields, onSubmit, submitLabel = 'Submit' }: FormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label="Form">
      {fields.map((field) => (
        <div key={field.name}>
          <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
          </label>
          <input
            id={field.name}
            name={field.name}
            type={field.type || 'text'}
            required={field.required}
            placeholder={field.placeholder}
            aria-required={field.required}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
            onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
          />
        </div>
      ))}
      <button type="submit" className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-500">
        {submitLabel}
      </button>
    </form>
  );
}
`;
}

function generateDataTableComponent(stack: string): string {
  return `import React from 'react';

interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
}

interface DataTableProps<T extends Record<string, any>> {
  columns: Column<T>[];
  data: T[];
  caption?: string;
}

export default function DataTable<T extends Record<string, any>>({ columns, data, caption }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)} scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              {columns.map((col) => (
                <td key={String(col.key)} className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
`;
}

function generateCardGridComponent(stack: string): string {
  return `import React from 'react';

interface Card {
  title: string;
  description: string;
  image?: string;
  href?: string;
}

interface CardGridProps {
  cards: Card[];
  columns?: 2 | 3 | 4;
}

export default function CardGrid({ cards, columns = 3 }: CardGridProps) {
  const gridCols = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' };

  return (
    <div className={\`grid gap-6 \${gridCols[columns]}\`} role="list">
      {cards.map((card) => (
        <article key={card.title} className="rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow" role="listitem">
          {card.image && <img src={card.image} alt={\`\${card.title} illustration\`} className="h-48 w-full object-cover" />}
          <div className="p-6">
            <h3 className="text-lg font-semibold">{card.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{card.description}</p>
            {card.href && (
              <a href={card.href} className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-500"
                aria-label={\`Learn more about \${card.title}\`}>
                Learn more →
              </a>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
`;
}

function generateNavigationComponent(stack: string): string {
  return `import React, { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  active?: boolean;
}

interface NavigationProps {
  brand: string;
  items: NavItem[];
}

export default function Navigation({ brand, items }: NavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="border-b border-gray-200 bg-white" aria-label="Main navigation">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <a href="/" className="text-xl font-bold" aria-label={\`\${brand} home\`}>{brand}</a>

        {/* Desktop */}
        <ul className="hidden gap-8 md:flex" role="list">
          {items.map((item) => (
            <li key={item.href}>
              <a href={item.href}
                className={\`text-sm font-medium \${item.active ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}\`}
                aria-current={item.active ? 'page' : undefined}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Mobile toggle */}
        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen} aria-label="Toggle navigation menu">
          <span className="block h-0.5 w-6 bg-gray-600" />
          <span className="mt-1.5 block h-0.5 w-6 bg-gray-600" />
          <span className="mt-1.5 block h-0.5 w-6 bg-gray-600" />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <ul className="border-t border-gray-200 px-4 py-4 md:hidden" role="list">
          {items.map((item) => (
            <li key={item.href}>
              <a href={item.href} className="block py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                aria-current={item.active ? 'page' : undefined}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
`;
}

function generateHeroComponent(stack: string): string {
  return `import React from 'react';

interface HeroProps {
  title: string;
  subtitle?: string;
  ctaPrimary?: { label: string; href: string };
  ctaSecondary?: { label: string; href: string };
  image?: string;
}

export default function Hero({ title, subtitle, ctaPrimary, ctaSecondary, image }: HeroProps) {
  return (
    <section className="relative overflow-hidden px-4 py-24 sm:py-32">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-16 lg:flex-row">
        <div className="flex-1 text-center lg:text-left">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">{title}</h1>
          {subtitle && <p className="mt-6 text-lg text-gray-600">{subtitle}</p>}
          {(ctaPrimary || ctaSecondary) && (
            <div className="mt-10 flex flex-wrap justify-center gap-4 lg:justify-start">
              {ctaPrimary && (
                <a href={ctaPrimary.href}
                  className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500"
                  aria-label={ctaPrimary.label}>
                  {ctaPrimary.label}
                </a>
              )}
              {ctaSecondary && (
                <a href={ctaSecondary.href}
                  className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-900 hover:bg-gray-50"
                  aria-label={ctaSecondary.label}>
                  {ctaSecondary.label}
                </a>
              )}
            </div>
          )}
        </div>
        {image && (
          <div className="flex-1">
            <img src={image} alt="Hero illustration" className="rounded-2xl shadow-xl" />
          </div>
        )}
      </div>
    </section>
  );
}
`;
}
