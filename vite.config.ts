import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [react(), tailwindcss()],
	publicDir: 'static',

	server: {
		allowedHosts: ['2a39-58-178-116-127.ngrok-free.app']
	},
	test: {
		environment: 'jsdom',
		clearMocks: true,
		setupFiles: ['./vitest-setup-client.ts']
	}
});
