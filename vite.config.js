import {
    defineConfig
} from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        // Redirige los fetch relativos /api al backend de Flask
        proxy: {
            '/api': 'http://localhost:3001'
        }
    },
    build: {
        outDir: 'dist'
    }
})
