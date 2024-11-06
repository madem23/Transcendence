
const { colors } = require('tailwindcss/colors')
const { fontFamily } = require('tailwindcss/defaultTheme')


const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
module.exports = {
  

  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',

    // Or if using `src` directory:
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    fontFamily: {
      "press-start-2p": "'Press Start 2P'",
    },
    
  fontSize: {
    "7xs": "6px",
    xs: "12px",
    xl: "20px",
    "3xs": "10px",
    inherit: "inherit",
  },
    container: {
      center: true,
      padding: '1.5rem',
      screens: {
        '2xl': '1360px',
      },
    },
    extend: {
      padding: {
      '4.5': '1.125rem'
      },
      width: {
        '72': '14rem', // This adds a new width utility class: w-72 that will be 18rem
        '12': '5rem',
      },
      height: {
        '72': '14rem',
        'rec': '35rem', // This adds a new height utility class: h-72 that will be 18rem
        '12': '5rem',
      },

      spacing: {
        '45': '18rem',  // p-24 will be 6rem
 
      },

      textShadow: {
        sm: '0 1px 2px var(--tw-shadow-color)',
        DEFAULT: '0 2px 4px var(--tw-shadow-color)',
        lg: '0 8px 16px var(--tw-shadow-color)',
        'neon-magenta': '0 0 5px #FF00FF, 0 0 10px #FF00FF, 0 0 15px #FF00FF, 0 0 20px #FF00FF',
      },
      boxShadow: {
        sm: '0 1px 2px var(--tw-shadow-color)',
        DEFAULT: '0 2px 4px var(--tw-shadow-color)',
        lg: '0 8px 16px var(--tw-shadow-color)',
        'neon-magenta': '0 0 5px #FF00FF, 0 0 10px #FF00FF, 0 0 15px #FF00FF, 0 0 20px #FF00FF',
      },
 
      fontFamily: {
        sans: ['var(--font-inter)', ...fontFamily.sans],
      },
      colors: {
        ...colors,
        'light-gold': '#f5bc51',
        'dark-gold': '#533519',
        'dark-purple': '#110023',
      },
    },
  },

  plugins: [
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          'text-shadow': (value) => ({
            textShadow: value,
          }),
        },
        { values: theme('textShadow') }
      )
    }),
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities({
        'box-shadow': (value) => ({
          boxShadow: value,
        }),
      },
      { values: theme('boxShadow') }
      )
    }),
    require('tailwindcss-animate'), require('@tailwindcss/typography')
  ],
}

