import { defineConfig, loadEnv } from 'vite';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'REACT_APP_');
  return {
    define: { 'process.env.REACT_APP_API_URL': JSON.stringify(env.REACT_APP_API_URL || '/api') },
    server: { proxy: { '/api': { target: 'http://localhost:3001', ws: true }, '/arquivos': 'http://localhost:3001', '/uploads': 'http://localhost:3001' } }
  };
});
