import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx}',
    './index.html',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--shadcn-border))',
        input: 'hsl(var(--shadcn-input))',
        ring: 'hsl(var(--shadcn-ring))',
        background: 'hsl(var(--shadcn-background))',
        foreground: 'hsl(var(--shadcn-foreground))',
        primary: {
          DEFAULT: 'hsl(var(--shadcn-primary))',
          foreground: 'hsl(var(--shadcn-primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--shadcn-secondary))',
          foreground: 'hsl(var(--shadcn-secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--shadcn-destructive))',
          foreground: 'hsl(var(--shadcn-destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--shadcn-muted))',
          foreground: 'hsl(var(--shadcn-muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--shadcn-accent))',
          foreground: 'hsl(var(--shadcn-accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--shadcn-popover))',
          foreground: 'hsl(var(--shadcn-popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--shadcn-card))',
          foreground: 'hsl(var(--shadcn-card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--shadcn-radius)',
        md: 'calc(var(--shadcn-radius) - 2px)',
        sm: 'calc(var(--shadcn-radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
}

export default config
