// Resolves the "@/..." alias and extensionless .ts imports so scripts can import survey/*.ts directly.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function withExt(file) {
  for (const ext of ['', '.ts', '.tsx', '/index.ts']) {
    const p = file + ext;
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  return null;
}

export async function resolve(specifier, context, next) {
  if (specifier.startsWith('@/')) {
    const file = withExt(path.join(ROOT, specifier.slice(2)));
    if (file) return next(pathToFileURL(file).href, context);
  } else if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
    const base = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
    const file = withExt(base);
    if (file) return next(pathToFileURL(file).href, context);
  }
  return next(specifier, context);
}
