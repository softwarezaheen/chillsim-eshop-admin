import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import eslint from "vite-plugin-eslint";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs"; // To read the package.json file
import tailwindcss from "@tailwindcss/vite";
export default defineConfig(({ mode }) => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  const env = loadEnv(mode, __dirname);

  const packageJson = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "package.json"), "utf-8")
  );

  return {
    plugins: [tailwindcss(), react(), eslint()],
    optimizeDeps: {
      // Pre-bundle MUI icons to reduce file scanning during build
      include: ['@mui/icons-material'],
      esbuildOptions: {
        // Limit concurrent file operations
        logLimit: 0,
      },
    },
    server: {
      open: true,
      port: parseInt(env.VITE_PORT),
      hmr: true,
      hot: true,
    },
    test: {
      globals: true,
      environment: "jsdom",
      include: ["src/**/*.{test,spec}.{js,jsx,ts,tsx}"],
      coverage: {
        reporter: ["text", "lcov", "html"],
        all: true,
        include: ["src/**/*.{js,jsx,ts,tsx}"],
        exclude: [
          "**/*.test.{js,jsx,ts,tsx}",
          "**/node_modules/**",
          "**/mocks/**",
        ],
      },
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        // Limit concurrent file operations to prevent "too many open files" error on Windows
        maxParallelFileOps: 20,
        output: {
          manualChunks: (id) => {
            // Bundle MUI icons into a single chunk to reduce file handle usage
            if (id.includes('node_modules/@mui/icons-material')) {
              return 'mui-icons';
            }
            // Bundle other vendor dependencies
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('node_modules/@mui/material')) {
              return 'mui-material';
            }
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
      },
      target: "esnext",
      sourcemap: false,
      outDir: `build`,
      minify: "esbuild",
      chunkSizeWarningLimit: 1000,
    },
    assetsInclude: ["**/*.xlsx"],
    define: {
      __APP_ENV__: JSON.stringify(mode),
      __APP_VERSION__: JSON.stringify(packageJson.version),
      ...Object.keys(env).reduce((prev, key) => {
        prev[`process.env.${key}`] = JSON.stringify(env[key]);
        return prev;
      }, {}),
    },
  };
});
