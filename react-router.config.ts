import type { Config } from "@react-router/dev/config";

export default {
  ssr: false,
  appDirectory: "src/app",
  buildDirectory: 'dist',
  prerender: ["/"],
} satisfies Config;
