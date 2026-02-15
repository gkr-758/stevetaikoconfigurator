import { defineConfig } from "vite";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import i18next from "vite-plugin-i18next-loader";
import svgr from "vite-plugin-svgr";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";
import { VitePWA } from "vite-plugin-pwa";
import jotaiDebugLabel from "jotai/babel/plugin-debug-label";
import jotaiReactRefresh from "jotai/babel/plugin-react-refresh";

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react({
			babel: {
				plugins: [jotaiDebugLabel, jotaiReactRefresh],
			},
		}),
		i18next({
			paths: ["locales"],
			namespaceResolution: "basename",
		}),
		svgr(),
		wasm(),
		topLevelAwait(),
		VitePWA({
			registerType: "autoUpdate",
			includeAssets: ["favicon.png", "logo.svg"],
			manifest: {
				name: "Steve Taiko Configurator",
				short_name: "TaikoConfig",
				description: "A tool to configure Steve Taiko controllers",
				theme_color: "#111113",
				icons: [
					{
						src: "pwa-192x192.png",
						sizes: "192x192",
						type: "image/png",
					},
					{
						src: "pwa-512x512.png",
						sizes: "512x512",
						type: "image/png",
					},
					{
						src: "logo.svg",
						sizes: "any",
						type: "image/svg+xml",
						purpose: "any",
					},
				],
			},
		}),
	],
	envPrefix: ["VITE_", "TAURI_"],

	// Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
	//
	// 1. prevent vite from obscuring rust errors
	clearScreen: false,
	// 2. tauri expects a fixed port, fail if that port is not available
	server: {
		port: 1420,
		strictPort: true,
		host: host || false,
		hmr: host
			? {
				protocol: "ws",
				host,
				port: 1421,
			}
			: undefined,
		watch: {
			// 3. tell vite to ignore watching `src-tauri`
			ignored: ["**/src-tauri/**"],
		},
	},
	resolve: {
		alias: {
			$: resolve(__dirname, "src"),
		},
	},
	worker: {
		format: "es",
	},
});
