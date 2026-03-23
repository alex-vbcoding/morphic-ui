# 🎯 Morphic

**AI design guardrail toolkit** — Make LLMs better at generating consistent, accessible UI code.

[![npm](https://img.shields.io/npm/v/morphic-ui)](https://npmjs.com/package/morphic-ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## The Problem

LLMs generate great UI code. But they're bad at **consistency**:
- Page 1 uses `padding: 16px`, page 2 uses `padding: 20px`
- Hardcoded colors instead of design tokens
- Missing accessibility attributes
- Can't see what they generate — visual bugs go unnoticed

## The Solution

Morphic doesn't replace your design system. It makes LLMs **better** at using it.

| Without Morphic | With Morphic |
|---|---|
| Hardcoded colors everywhere | Design tokens enforced |
| Inconsistent spacing | Spacing scale validated |
| Missing aria-labels | Accessibility auto-checked |
| Visual bugs unseen | Screenshots analyzed |
| Boilerplate every time | Templates + context |

## Works With Everything

MUI • Radix • Tailwind • Chakra • Shadcn • Ant Design • Vanilla CSS • Any framework

## Quick Start

```bash
npm install -g morphic-ui

# Initialize your design context
morphic init

# Lint your code for design consistency
morphic lint ./src

# Generate page/component scaffolds
morphic generate --page pricing

# Validate visual output
morphic validate ./src/pages/pricing.tsx
```

## 4 Modules

### 1. Design Context (`.morphic/`)

Define your design system rules so LLMs generate consistent code.

```bash
morphic init
# Interactive wizard: stack, tokens, rules, patterns
# Generates .morphic/context.json
```

```json
{
  "stack": {
    "framework": "react",
    "ui": "tailwind",
    "language": "typescript"
  },
  "tokens": {
    "colors": { "primary": "#2563EB", "secondary": "#64748B" },
    "spacing": [4, 8, 12, 16, 24, 32, 48, 64],
    "radii": { "sm": "4px", "md": "8px", "lg": "16px" }
  },
  "rules": [
    "Never hardcode colors — use Tailwind classes",
    "All images must have alt text",
    "Minimum touch target: 44px",
    "Use gap for spacing between siblings, not margin"
  ]
}
```

Include this in your LLM prompts and watch consistency improve instantly.

### 2. Design Lint

Catch mistakes LLMs make — automatically.

```bash
morphic lint ./src

  src/components/Button.tsx
    ❌ L12: Hardcoded color "#3B82F6" — use token "primary" instead
    ❌ L28: Missing aria-label on interactive element
    ⚠️ L35: Spacing value "20px" not in scale [4,8,12,16,24,32,48,64]

  src/pages/Home.tsx
    ❌ L45: Touch target too small (32px) — minimum 44px
    ⚠️ L67: Inline style — prefer design tokens

  Found 3 errors, 2 warnings in 2 files
  Run `morphic lint --fix` to auto-fix 2 issues
```

### 3. Codegen Templates

Generate scaffolds using YOUR design system patterns.

```bash
morphic generate --page pricing
# ✅ Generated src/pages/PricingPage.tsx using your stack (React + Tailwind)

morphic generate --component data-table
# ✅ Generated src/components/DataTable.tsx
```

### 4. Visual Validator

See what LLMs can't — render and analyze the output.

```bash
morphic validate ./src/pages/pricing.tsx

  Desktop (1440px):  ✅ No issues
  Tablet (768px):    ⚠️ CTA button below fold
  Mobile (375px):    ❌ Text overflow on pricing card

  Report: .morphic/reports/pricing-2024-01-15.html
```

## Philosophy

1. **LLMs already know MUI/Tailwind** — don't reinvent, augment
2. **Build-time tool, not runtime** — zero performance impact
3. **Works with any design system** — not locked to one library
4. **Catches what LLMs miss** — consistency, a11y, visual bugs
5. **Reduces tokens** — templates mean less boilerplate to generate

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT © [Alex Chen](https://github.com/alex-vbcoding)
