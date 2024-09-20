/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#5432c3',
        'primary-dark': '#4a2ca8',
      },
    },
  },
  plugins: []
};
