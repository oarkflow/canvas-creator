import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
    server: {
        host: "::",
        port: 8080,
    },

    plugins: [
        react(),
        mode === "development" && componentTagger(),
    ].filter(Boolean),

    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },

    build: {
        sourcemap: mode === "development",
        target: "es2020",
        chunkSizeWarningLimit: 600,

        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes("node_modules")) return;

                    if (id.includes("anchorlib") || id.includes("anchorlib/react")) {
                        return "anchorlib";
                    }

                    /* ---------------- Core Framework ---------------- */
                    if (id.includes("react") || id.includes("react-dom")) {
                        return "framework";
                    }

                    /* ---------------- Routing & State ---------------- */
                    if (
                        id.includes("react-router") ||
                        id.includes("zustand") ||
                        id.includes("@tanstack")
                    ) {
                        return "state-routing";
                    }

                    /* ---------------- Radix + shadcn UI ---------------- */
                    if (id.includes("@radix-ui")) {
                        return "ui-radix";
                    }

                    if (
                        id.includes("class-variance-authority") ||
                        id.includes("clsx") ||
                        id.includes("tailwind-merge") ||
                        id.includes("tailwindcss-animate") ||
                        id.includes("sonner") ||
                        id.includes("vaul")
                    ) {
                        return "ui-utils";
                    }

                    /* ---------------- Forms & Validation ---------------- */
                    if (
                        id.includes("react-hook-form") ||
                        id.includes("@hookform") ||
                        id.includes("zod")
                    ) {
                        return "forms";
                    }

                    /* ---------------- Charts & Visualization ---------------- */
                    if (id.includes("recharts")) {
                        return "charts";
                    }

                    /* ---------------- Drag & Drop ---------------- */
                    if (id.includes("@dnd-kit")) {
                        return "dnd";
                    }

                    /* ---------------- Date & Utilities ---------------- */
                    if (
                        id.includes("date-fns") ||
                        id.includes("uuid")
                    ) {
                        return "utils";
                    }

                    /* ---------------- Carousel & Media ---------------- */
                    if (id.includes("embla-carousel")) {
                        return "media";
                    }

                    /* ---------------- Fallback Vendor ---------------- */
                    return "vendor";
                },

                assetFileNames: "assets/[name]-[hash][extname]",
                chunkFileNames: "assets/[name]-[hash].js",
                entryFileNames: "assets/[name]-[hash].js",
            },
        },
    },
}));
