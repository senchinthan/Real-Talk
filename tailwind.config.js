module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        success: {
          100: 'var(--color-success-100)',
          200: 'var(--color-success-200)',
        },
        destructive: {
          100: 'var(--color-destructive-100)',
          200: 'var(--color-destructive-200)',
        },
        primary: {
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
        },
        light: {
          100: 'var(--color-light-100)',
          400: 'var(--color-light-400)',
          600: 'var(--color-light-600)',
          800: 'var(--color-light-800)',
        },
        dark: {
          100: 'var(--color-dark-100)',
          200: 'var(--color-dark-200)',
          300: 'var(--color-dark-300)',
        },
      },
      fontFamily: {
        sans: ['var(--font-mona-sans)', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}