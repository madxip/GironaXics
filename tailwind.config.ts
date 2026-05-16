import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        verd: '#1A6B3A',
        'verd-fosc': '#0D3D20',
        'verd-pallid': '#D4EDD9',
        taronja: '#F5A623',
        crema: '#F7F4EE',
        'crema-fosca': '#EDE8DF',
        fosc: '#1A1A18',
        muted: '#6B6B65',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
