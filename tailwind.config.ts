import type { Config } from 'tailwindcss';

/**
 * Tailwind serves the admin surfaces only. Preflight is off: the public site
 * is styled by the approved design sheets (organic.css / home.css) and a
 * global reset would quietly undo them.
 */
const config: Config = {
  corePlugins: { preflight: false },
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      // Mirrors the design tokens so admin sits in the same palette.
      colors: {
        ink: '#16262d',
        night: '#10242c',
        sky: '#f1f6fa',
        surface: '#e2edf4',
        accent: '#e2793a',
        accent700: '#9c4514',
        lagoon: '#2f8f86',
        line: 'rgba(22,38,45,0.16)',
      },
    },
  },
  plugins: [],
};
export default config;
