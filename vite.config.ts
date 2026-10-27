import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

let outputDirectory: string;

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'web3-offline-shell',
      apply: 'build',
      configResolved(config) {
        outputDirectory = resolve(config.root, config.build.outDir);
      },
      async closeBundle() {
        const directory = outputDirectory;
        const files = (await readdir(resolve(directory, 'assets')))
          .filter((name) => /\.(js|css)$/.test(name))
          .sort();
        const urls = [
          '/',
          '/index.html',
          '/manifest.webmanifest',
          '/pwa.svg',
          ...files.map((name) => `/assets/${name}`),
        ];
        const template = await readFile(
          resolve(import.meta.dirname, 'public/sw.js'),
          'utf8',
        );
        const hash = createHash('sha256').update(template);
        for (const path of urls.filter((path) => path !== '/'))
          hash.update(await readFile(resolve(directory, `.${path}`)));
        const worker = template
          .replace('__SHELL_VERSION__', hash.digest('hex').slice(0, 16))
          .replace(/\/\* __SHELL_URLS__ \*\/ \[[^;]+\]/, JSON.stringify(urls));
        await writeFile(resolve(directory, 'sw.js'), worker);
      },
    },
  ],
});
