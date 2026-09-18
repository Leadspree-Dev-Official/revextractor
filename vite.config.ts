import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // 5173 by default, but PORT wins — a git worktree often runs alongside the
  // main checkout's own dev server, and two copies of the app fighting over one
  // port is how you end up debugging the wrong branch.
  server: { port: Number(process.env.PORT) || 5173 },
});
