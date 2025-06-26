/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Refined minimalist palette - sophisticated neutrals
        primary: {
          50: '#fafbfc',   // softest background
          100: '#f4f6f8',  // surface background
          200: '#e1e7ec',  // subtle borders
          300: '#d0d9e2',  // light borders
          400: '#9aa6b2',  // disabled text
          500: '#6b7785',  // secondary text
          600: '#4a5763',  // body text
          700: '#2f3a45',  // primary text
          800: '#1c252e',  // headings
          900: '#0f1419',  // darkest text
        },
        // Warm sophisticated grays
        gray: {
          50: '#fafbfc',   // warm background
          100: '#f5f7fa',  // card background
          200: '#eaeef2',  // subtle border
          300: '#d6dde4',  // border
          400: '#9ca9b4',  // muted text
          500: '#6b7785',  // secondary text
          600: '#4a5763',  // text
          700: '#2f3a45',  // dark text
          800: '#1c252e',  // darker text
          900: '#0f1419',  // darkest
        },
        // Refined accent colors
        accent: {
          emerald: {
            50: '#f0fdfa',
            100: '#ccfbf1',
            500: '#10b981',
            600: '#059669',
            700: '#047857',
          },
          amber: {
            50: '#fffbeb',
            100: '#fef3c7',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
          },
          red: {
            50: '#fef2f2',
            100: '#fee2e2',
            500: '#ef4444',
            600: '#dc2626',
            700: '#b91c1c',
          },
          blue: {
            50: '#eff6ff',
            100: '#dbeafe',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
          },
        },
      },
      fontFamily: {
        'serif': ['Playfair Display', 'Georgia', 'serif'],
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.125rem', letterSpacing: '0.025em' }],
        'sm': ['0.875rem', { lineHeight: '1.375rem', letterSpacing: '0.015em' }],
        'base': ['1rem', { lineHeight: '1.625rem', letterSpacing: '0em' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.015em' }],
        'xl': ['1.25rem', { lineHeight: '1.875rem', letterSpacing: '-0.025em' }],
        '2xl': ['1.5rem', { lineHeight: '2.25rem', letterSpacing: '-0.035em' }],
        '3xl': ['1.875rem', { lineHeight: '2.5rem', letterSpacing: '-0.045em' }],
        '4xl': ['2.25rem', { lineHeight: '2.75rem', letterSpacing: '-0.055em' }],
        '5xl': ['3rem', { lineHeight: '3.5rem', letterSpacing: '-0.065em' }],
        '6xl': ['3.75rem', { lineHeight: '4rem', letterSpacing: '-0.075em' }],
        '7xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.085em' }],
        '8xl': ['6rem', { lineHeight: '1', letterSpacing: '-0.095em' }],
        '9xl': ['8rem', { lineHeight: '1', letterSpacing: '-0.105em' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem', 
        '30': '7.5rem',
        '34': '8.5rem',
        '88': '22rem',
        '128': '32rem',
        // Semantic spacing
        'section': '6rem',
        'section-sm': '4rem',
        'container': '2rem',
        'component': '1.5rem',
        'element': '1rem',
      },
      boxShadow: {
        'brutal': '2px 2px 0px 0px rgba(0,0,0,1)',
        'brutal-sm': '2px 2px 0px 0px rgba(0,0,0,1)',
        'brutal-lg': '2px 2px 0px 0px rgba(0,0,0,1)',
        'brutal-xl': '2px 2px 0px 0px rgba(0,0,0,1)',
      },
      borderWidth: {
        '3': '3px',
        '5': '5px',
        '6': '6px',
        '8': '8px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'brutalist-pulse': 'brutalist-pulse 1s ease-in-out infinite',
        'brutalist-shake': 'brutalist-shake 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'brutalist-pulse': {
          '0%, 100%': { transform: 'scale(1) rotate(0deg)' },
          '50%': { transform: 'scale(1.05) rotate(1deg)' },
        },
        'brutalist-shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-2px) rotate(-1deg)' },
          '75%': { transform: 'translateX(2px) rotate(1deg)' },
        },
      },
      letterSpacing: {
        'tightest': '-0.075em',
        'tighter': '-0.05em',
        'tight': '-0.025em',
        'normal': '0em',
        'wide': '0.025em',
        'wider': '0.05em',
        'widest': '0.1em',
        'ultra-wide': '0.25em',
      },
      lineHeight: {
        'none': '1',
        'tight': '1.25',
        'snug': '1.375',
        'normal': '1.5',
        'relaxed': '1.625',
        'loose': '2',
      },
    },
  },
  plugins: [
    // @tailwindcss/line-clamp is now included by default in Tailwind CSS v3.3+
  ],
} 