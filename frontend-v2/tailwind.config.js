/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colors (navy theme)
        primary: {
          DEFAULT: '#0f172a',
          light: '#1e293b',
          lighter: '#334155',
          dark: '#020617',
        },
        // Secondary colors
        secondary: {
          DEFAULT: '#64748b',
          light: '#94a3b8',
          dark: '#475569',
        },
        // Functional status colors
        success: {
          DEFAULT: '#10b981',
          bg: '#d1fae5',
        },
        ready: {
          DEFAULT: '#3b82f6',
          bg: '#dbeafe',
        },
        blocked: {
          DEFAULT: '#d1d5db',
          bg: '#f3f4f6',
        },
        warning: {
          DEFAULT: '#f59e0b',
          bg: '#fef3c7',
        },
        error: {
          DEFAULT: '#ef4444',
          bg: '#fee2e2',
        },
        info: {
          DEFAULT: '#06b6d4',
          bg: '#cffafe',
        },
        // Neutral colors
        'bg-primary': '#ffffff',
        'bg-secondary': '#f8fafc',
        'bg-tertiary': '#f1f5f9',
        'text-primary': '#0f172a',
        'text-secondary': '#475569',
        'text-tertiary': '#94a3b8',
        border: '#e2e8f0',
        'border-focus': '#0f172a',
        // Semantic colors
        link: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
        },
        // Legacy ShadCN variables (for compatibility)
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display': ['48px', { lineHeight: '1.2', fontWeight: '700' }],
      },
      spacing: {
        // Custom spacing values
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        // Design token spacing scale
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      borderRadius: {
        // Design token border radius
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '9999px',
        // Legacy ShadCN variables (for compatibility)
        'legacy-lg': 'var(--radius)',
        'legacy-md': 'calc(var(--radius) - 2px)',
        'legacy-sm': 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        // Design token shadows
        'token-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'token-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'token-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        'token-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
      zIndex: {
        // Design token z-index scale
        'base': '0',
        'dropdown': '100',
        'sticky': '200',
        'fixed': '300',
        'modal-backdrop': '400',
        'modal': '500',
        'popover': '600',
        'tooltip': '700',
      },
      transitionDuration: {
        'token-fast': '150ms',
        'token-normal': '250ms',
        'token-slow': '350ms',
      },
      transitionTimingFunction: {
        'token-in': 'cubic-bezier(0.4, 0, 1, 1)',
        'token-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'token-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      maxWidth: {
        // Component-specific dimensions
        'node': '200px',
        'sidebar': '240px',
        'sidebar-collapsed': '64px',
        'details': '400px',
      },
    },
  },
  plugins: [],
}
