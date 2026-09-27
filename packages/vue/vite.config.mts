import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
    plugins: [
        vue(),
    ],
    build: {
        lib: {
            entry: path.resolve(__dirname, 'src/index.ts'),
            name: 'KozmosVue',
            fileName: (format) => format === 'es' ? 'kozmos-vue.mjs' : 'kozmos-vue.umd.cjs',
        },
        rollupOptions: {
            external: ['vue', 'react', 'react-dom', 'react-dom/client', '@kozmos-ds/react'],
            output: {
                globals: {
                    vue: 'Vue',
                    react: 'React',
                    'react-dom': 'ReactDOM',
                    'react-dom/client': 'ReactDOMClient',
                    '@kozmos-ds/react': 'KozmosReact'
                }
            }
        }
    }
});
