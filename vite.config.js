import { defineConfig, loadEnv } from 'vite';

export default ({ mode }) => {
  // Load app-level env vars to node-level env vars.
  import.meta.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return defineConfig({
    base: '/Spotify-Visualizer'
  });
};
