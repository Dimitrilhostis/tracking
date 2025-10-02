// tailwind.config.js
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}", 
    "./components/**/*.{js,ts,jsx,tsx}",
    ],
  plugins: [require('@tailwindcss/line-clamp', 'tailwind-scrollbar')],
};
