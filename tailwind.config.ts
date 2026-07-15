import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          amber: '#F5A000',
          dark: '#111111',
          cardDark: '#1A1A1A',
        }
      }
    },
  },
  plugins: [],
}
export default config
