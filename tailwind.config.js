/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      colors: {
        primary: '#3b82f6',
        secondary: '#1d4ed8',
        background: {
          dark: '#000',
          light: '#fff',
        },
      },
      transitionDuration: {
        '2000': '2000ms',
      },
    },
  },
  plugins: [],
  // Optimize for production builds
  future: {
    hoverOnlyWhenSupported: true,
    respectDefaultRingColorOpacity: true,
  },
}
