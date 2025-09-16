import { defineConfig } from 'vite';
import { readdirSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

function findHtmlEntries(dir) {
  const entries = [];
  const directoryEntries = readdirSync(dir, { withFileTypes: true });

  for (const entry of directoryEntries) {
    if (entry.name.startsWith('.')) {
      if (entry.name === '.git' || entry.name === '.github') {
        continue;
      }
    }

    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      if (['node_modules', 'dist', 'public'].includes(entry.name)) {
        continue;
      }
      entries.push(...findHtmlEntries(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      entries.push(fullPath);
    }
  }

  return entries;
}

const htmlEntries = findHtmlEntries(projectRoot);
const sharedDirPrefix = `${projectRoot}${sep}shared${sep}`;

const rollupInput = {};
for (const filePath of htmlEntries) {
  if (filePath.startsWith(sharedDirPrefix)) {
    continue;
  }
  const relative = filePath.slice(projectRoot.length + 1).replace(/\\/g, '/');
  rollupInput[relative] = filePath;
}

function createSriPlugin({ algorithms = ['sha384'] } = {}) {
  const attributeRegex = (name) => new RegExp(`${name}=("|')[^"']*("|')`, 'i');

  const resolveIntegrity = (integrityMap, assetPath) => {
    if (!assetPath || /^(https?:)?\/\//.test(assetPath) || assetPath.startsWith('data:')) {
      return null;
    }

    const normalized = assetPath.replace(/^\.\/?/, '').replace(/^\//, '');
    return integrityMap.get(assetPath)
      || integrityMap.get(`/${normalized}`)
      || integrityMap.get(normalized);
  };

  const applyAttribute = (tag, tagName, name, value) => {
    const regex = attributeRegex(name);
    if (regex.test(tag)) {
      return tag.replace(regex, `${name}="${value}"`);
    }
    return tag.replace(`<${tagName}`, `<${tagName} ${name}="${value}"`);
  };

  return {
    name: 'vite-plugin-sri',
    apply: 'build',
    generateBundle(_options, bundle) {
      const integrityMap = new Map();

      for (const [fileName, output] of Object.entries(bundle)) {
        if (fileName.endsWith('.html')) {
          continue;
        }

        let source = null;
        if (output.type === 'asset') {
          if (typeof output.source === 'string') {
            source = Buffer.from(output.source);
          } else if (output.source instanceof Uint8Array) {
            source = Buffer.from(output.source);
          }
        } else if (output.type === 'chunk') {
          source = Buffer.from(output.code);
        }

        if (!source) {
          continue;
        }

        const normalizedName = fileName.replace(/\\/g, '/');
        const integrityValue = algorithms
          .map((algorithm) => `${algorithm}-${createHash(algorithm).update(source).digest('base64')}`)
          .join(' ');

        integrityMap.set(normalizedName, integrityValue);
        integrityMap.set(`/${normalizedName}`, integrityValue);
        integrityMap.set(`./${normalizedName}`, integrityValue);
      }

      for (const output of Object.values(bundle)) {
        if (output.type !== 'asset' || typeof output.source !== 'string' || !output.fileName.endsWith('.html')) {
          continue;
        }

        let html = output.source;

        html = html.replace(/<script\b[^>]*\bsrc=("|')[^"']+("|')[^>]*><\/script>/gi, (match) => {
          const srcMatch = match.match(/src=("|')([^"']+)("|')/i);
          if (!srcMatch) {
            return match;
          }

          const src = srcMatch[2];
          const integrity = resolveIntegrity(integrityMap, src);
          if (!integrity) {
            return match;
          }

          let updated = applyAttribute(match, 'script', 'integrity', integrity);
          updated = applyAttribute(updated, 'script', 'crossorigin', 'anonymous');
          return updated;
        });

        html = html.replace(/<link\b[^>]*>/gi, (match) => {
          if (!/rel=("|')(?:stylesheet|modulepreload)("|')/i.test(match)) {
            return match;
          }

          const hrefMatch = match.match(/href=("|')([^"']+)("|')/i);
          if (!hrefMatch) {
            return match;
          }

          const href = hrefMatch[2];
          const integrity = resolveIntegrity(integrityMap, href);
          if (!integrity) {
            return match;
          }

          let updated = applyAttribute(match, 'link', 'integrity', integrity);
          updated = applyAttribute(updated, 'link', 'crossorigin', 'anonymous');
          return updated;
        });

        output.source = html;
      }
    }
  };
}

export default defineConfig({
  plugins: [createSriPlugin({ algorithms: ['sha384'] })],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: true,
    rollupOptions: {
      input: rollupInput,
      treeshake: 'recommended',
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
});
