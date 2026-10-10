import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Relative base so the same build works at a domain root (Vercel) or a subpath (GitHub Pages).
export default defineConfig({ base: './', plugins: [react()] });
