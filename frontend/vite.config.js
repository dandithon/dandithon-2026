import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const projectEntry=fileURLToPath(new URL('./package.json',import.meta.url));

export default defineConfig({
  plugins: [tailwindcss()],
  server: { host: '127.0.0.1', port: 5173 },
  optimizeDeps: {
    // Explicit entries avoid scanning outside the project on restricted Windows hosts.
    noDiscovery: true,
    include: ['react', 'react-dom/client'],
    esbuildOptions: {
      tsconfigRaw: {},
      plugins: [{
        name: 'resolve-local-dependencies',
        setup(build) {
          build.onResolve({filter: /.*/},args=>{
            if(args.kind==='entry-point')return;
            try {
              return {path:createRequire(args.importer||projectEntry).resolve(args.path)};
            } catch {
              return; // Let Vite report unsupported dependencies normally.
            }
          });
        },
      }],
    },
  },
});
