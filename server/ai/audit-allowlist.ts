import fs from 'node:fs';
import path from 'node:path';

export const EXCLUDED_PATTERNS = [
  '.env*',
  'data/** (almacenamiento local, credenciales hash y secretos de sesión)',
  'node_modules/**',
  'dist/**',
  '.git/**',
  '*service-account*.json',
  '*.pem / *.key',
  'Registros reales de Google Sheets y datos privados',
];

const ALLOWED_EXTENSIONS = new Set(['.ts', '.tsx', '.css', '.html', '.json']);
const ALLOWED_ROOT_FILES = new Set(['server.ts', 'index.html', 'package.json', 'tsconfig.json', 'vite.config.ts']);
const ALLOWED_DIRS = ['src', 'server', 'shared'];

export function isAllowlistedRelativePath(relPath: string): boolean {
  const normalized = relPath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized) return false;
  if (
    normalized.startsWith('.env') ||
    normalized.startsWith('node_modules/') ||
    normalized.startsWith('dist/') ||
    normalized.startsWith('data/') ||
    normalized.startsWith('.git/') ||
    normalized.includes('service-account') ||
    normalized.endsWith('.pem') ||
    normalized.endsWith('.key') ||
    normalized.endsWith('.test.ts')
  ) {
    return false;
  }
  if (ALLOWED_ROOT_FILES.has(normalized)) return true;

  const topDir = normalized.split('/')[0];
  if (!ALLOWED_DIRS.includes(topDir)) return false;

  const ext = path.extname(normalized);
  return ALLOWED_EXTENSIONS.has(ext);
}

export interface AuditSourceFile {
  path: string;
  content: string;
}

export function collectAuditAllowlistedFiles(rootDir: string, maxTotalChars = 300_000): {
  files: AuditSourceFile[];
  includedPaths: string[];
  excludedSummary: string[];
} {
  const candidates: string[] = [];

  for (const file of ALLOWED_ROOT_FILES) {
    const full = path.join(rootDir, file);
    if (fs.existsSync(full) && fs.statSync(full).isFile()) {
      candidates.push(file);
    }
  }

  const walk = (dirRel: string) => {
    const fullDir = path.join(rootDir, dirRel);
    if (!fs.existsSync(fullDir)) return;
    const entries = fs.readdirSync(fullDir, { withFileTypes: true });
    for (const entry of entries) {
      const rel = `${dirRel}/${entry.name}`;
      if (entry.isDirectory()) {
        walk(rel);
      } else if (entry.isFile() && isAllowlistedRelativePath(rel)) {
        candidates.push(rel);
      }
    }
  };

  for (const dir of ALLOWED_DIRS) {
    walk(dir);
  }

  candidates.sort();

  const files: AuditSourceFile[] = [];
  const includedPaths: string[] = [];
  let totalChars = 0;

  for (const rel of candidates) {
    const full = path.join(rootDir, rel);
    const raw = fs.readFileSync(full, 'utf8');
    const lines = raw.split('\n');
    const numbered = lines.map((line, idx) => `${idx + 1}: ${line}`).join('\n');
    const bounded = numbered.slice(0, 12_000);
    if (totalChars + bounded.length > maxTotalChars) {
      break;
    }
    totalChars += bounded.length;
    files.push({ path: rel, content: bounded });
    includedPaths.push(rel);
  }

  return {
    files,
    includedPaths,
    excludedSummary: [...EXCLUDED_PATTERNS],
  };
}
