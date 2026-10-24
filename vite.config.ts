import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), [
    "VITE_",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  ]);
  return {
    define: {
      "import.meta.env.VITE_CLERK_PUBLISHABLE_KEY": JSON.stringify(
        env.VITE_CLERK_PUBLISHABLE_KEY ||
          env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
          "",
      ),
    },
    plugins: [react(), tailwindcss()],
    build: {
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            if (id.includes("/gsap/")) return "animation";
            if (
              id.includes("framer-motion") ||
              id.includes("motion-dom") ||
              id.includes("motion-utils")
            )
              return "motion";
            if (
              id.includes("/react/") ||
              id.includes("/react-dom/") ||
              id.includes("/scheduler/")
            )
              return "react-vendor";
            if (id.includes("/lenis/")) return "smooth-scroll";
          },
        },
      },
    },
    server: { host: "0.0.0.0", port: 4173, allowedHosts: ["terminal.local"] },
  };
});
