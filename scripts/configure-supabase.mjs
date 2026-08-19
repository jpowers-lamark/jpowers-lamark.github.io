import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(root, 'assets/config.js');
const rl = readline.createInterface({ input, output });

function sanitize(value) {
  return value.trim().replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

try {
  const current = await readFile(configPath, 'utf8');
  const currentUrl = current.match(/supabaseUrl:\s*'([^']*)'/)?.[1] || '';
  const currentKey = current.match(/supabaseAnonKey:\s*'([^']*)'/)?.[1] || '';

  const url = process.env.SUPABASE_URL || await rl.question(`Supabase project URL${currentUrl ? ` [${currentUrl}]` : ''}: `) || currentUrl;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || await rl.question(`Supabase publishable key${currentKey ? ' [keep current]' : ''}: `) || currentKey;

  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url.trim())) {
    throw new Error('The project URL must look like https://PROJECT.supabase.co');
  }
  if (!key.trim() || key.length < 20) throw new Error('A publishable key is required.');
  if (/service[_-]?role/i.test(key)) throw new Error('Do not use a service-role key in browser configuration.');

  const next = current
    .replace(/supabaseUrl:\s*'[^']*'/, `supabaseUrl: '${sanitize(url).replace(/\/$/, '')}'`)
    .replace(/supabaseAnonKey:\s*'[^']*'/, `supabaseAnonKey: '${sanitize(key)}'`);
  await writeFile(configPath, next);
  console.log('Updated assets/config.js. Run npm run validate next.');
} finally {
  rl.close();
}
