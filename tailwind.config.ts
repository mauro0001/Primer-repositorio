import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        duoc: {
          DEFAULT: "#003057",
          light: "#0059a3",
        },
      },
    },
  },
  plugins: [],
};
export default config;
