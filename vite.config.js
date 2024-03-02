import { defineConfig, loadEnv } from 'vite';

export default ({ mode }) => {
  return defineConfig({
    base: '/Spotify-Visualizer',
    build: {
      target: "ES2022"
    },
  });
};
