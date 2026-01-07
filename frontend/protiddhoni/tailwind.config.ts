import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Custom brand colors from palette
        primary: {
          50: '#FEF7ED',
          100: '#FDEFD1',
          200: '#FBDCA3',
          300: '#F8C56F',
          400: '#F4AA3E',
          500: '#DB9733',
          600: '#C98729',
          700: '#A76E23',
          800: '#865724',
          900: '#6D4A21',
        },
        accent: {
          50: '#FCF3F2',
          100: '#F9E5E3',
          200: '#F3CCC8',
          300: '#EAA9A3',
          400: '#DD7A70',
          500: '#B92F1F',
          600: '#A82A1C',
          700: '#8C231A',
          800: '#711D18',
          900: '#5B1916',
        },
        neutral: {
          50: '#F9F9F9',
          100: '#F3F3F3',
          200: '#E5E5E5',
          300: '#D1D1D2',
          400: '#A8A8A9',
          500: '#646665',
          600: '#545556',
          700: '#444546',
          800: '#353637',
          900: '#1E1E22',
        },
        olive: {
          50: '#F6F7F5',
          100: '#EBECEA',
          200: '#D7D8D5',
          300: '#B8BAB4',
          400: '#979A91',
          500: '#424739',
          600: '#3B3F34',
          700: '#32352C',
          800: '#292B24',
          900: '#21231E',
        },
      },
      fontFamily: {
        kalpurush: ["var(--font-kalpurush)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
