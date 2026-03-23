export interface MorphicContext {
  version: string;
  stack: {
    framework: string;
    ui: string;
    language: string;
    cssApproach: string;
  };
  tokens: {
    colors: Record<string, string>;
    spacing: number[];
    radii: Record<string, string>;
    typography: {
      fontFamily: string;
      sizes: Record<string, string>;
      weights: Record<string, number>;
      lineHeights: Record<string, number>;
    };
    shadows: Record<string, string>;
    breakpoints: Record<string, string>;
  };
  rules: string[];
  accessibility: {
    level: 'A' | 'AA' | 'AAA';
    minContrast: number;
    minTouchTarget: string;
    requireAltText: boolean;
    requireAriaLabels: boolean;
  };
  patterns: {
    componentDir: string;
    pageDir: string;
    namingConvention: 'PascalCase' | 'kebab-case' | 'camelCase';
    fileExtension: string;
  };
}

export const DEFAULT_CONTEXT: MorphicContext = {
  version: '0.1.0',
  stack: {
    framework: 'react',
    ui: 'tailwind',
    language: 'typescript',
    cssApproach: 'utility-first',
  },
  tokens: {
    colors: {
      primary: '#2563EB',
      'primary-hover': '#1D4ED8',
      secondary: '#64748B',
      'secondary-hover': '#475569',
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
      background: '#FFFFFF',
      'background-secondary': '#F8FAFC',
      foreground: '#0F172A',
      'foreground-muted': '#64748B',
      border: '#E2E8F0',
    },
    spacing: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96],
    radii: {
      none: '0px',
      sm: '4px',
      md: '8px',
      lg: '12px',
      xl: '16px',
      full: '9999px',
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      sizes: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
      },
      weights: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
      lineHeights: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75,
      },
    },
    shadows: {
      sm: '0 1px 2px rgba(0,0,0,0.05)',
      md: '0 4px 6px rgba(0,0,0,0.1)',
      lg: '0 10px 15px rgba(0,0,0,0.1)',
      xl: '0 20px 25px rgba(0,0,0,0.1)',
    },
    breakpoints: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
  },
  rules: [
    'Never hardcode color values — use design tokens or Tailwind classes',
    'Use spacing scale values only — no arbitrary pixel values for padding/margin/gap',
    'All images must have descriptive alt text',
    'All interactive elements must have aria-label or visible label text',
    'Minimum touch target size: 44x44px',
    'Use semantic HTML elements (button, nav, main, section, article)',
    'Use gap for spacing between siblings, not margin on children',
    'No inline styles — use classes or design tokens',
    'Color contrast must meet WCAG AA (4.5:1 text, 3:1 large text)',
    'Focus styles must be visible on all interactive elements',
  ],
  accessibility: {
    level: 'AA',
    minContrast: 4.5,
    minTouchTarget: '44px',
    requireAltText: true,
    requireAriaLabels: true,
  },
  patterns: {
    componentDir: 'src/components',
    pageDir: 'src/pages',
    namingConvention: 'PascalCase',
    fileExtension: '.tsx',
  },
};

export const PRESETS: Record<string, Partial<MorphicContext>> = {
  minimal: {
    tokens: {
      ...DEFAULT_CONTEXT.tokens,
      colors: {
        primary: '#2563EB',
        secondary: '#64748B',
        background: '#FFFFFF',
        foreground: '#0F172A',
      },
    },
    rules: DEFAULT_CONTEXT.rules.slice(0, 5),
  },
  enterprise: {
    accessibility: {
      level: 'AAA',
      minContrast: 7,
      minTouchTarget: '48px',
      requireAltText: true,
      requireAriaLabels: true,
    },
    rules: [
      ...DEFAULT_CONTEXT.rules,
      'All forms must have associated labels — no placeholder-only inputs',
      'Error messages must be programmatically associated with inputs',
      'Skip navigation link required on all pages',
      'All modals must trap focus and return focus on close',
      'No content should flash more than 3 times per second',
    ],
  },
};

export const STACK_PRESETS: Record<string, MorphicContext['stack']> = {
  'react-tailwind': { framework: 'react', ui: 'tailwind', language: 'typescript', cssApproach: 'utility-first' },
  'react-mui': { framework: 'react', ui: 'mui', language: 'typescript', cssApproach: 'css-in-js' },
  'react-radix': { framework: 'react', ui: 'radix', language: 'typescript', cssApproach: 'css-modules' },
  'react-shadcn': { framework: 'react', ui: 'shadcn', language: 'typescript', cssApproach: 'utility-first' },
  'react-chakra': { framework: 'react', ui: 'chakra', language: 'typescript', cssApproach: 'css-in-js' },
  'vue-tailwind': { framework: 'vue', ui: 'tailwind', language: 'typescript', cssApproach: 'utility-first' },
  'next-tailwind': { framework: 'nextjs', ui: 'tailwind', language: 'typescript', cssApproach: 'utility-first' },
  'svelte-tailwind': { framework: 'svelte', ui: 'tailwind', language: 'typescript', cssApproach: 'utility-first' },
};
