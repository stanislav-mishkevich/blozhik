import fs from 'fs';
import path from 'path';

const root = process.cwd();
const envPath = path.join(root, '.env');
const examplePath = path.join(root, '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) {
  fs.copyFileSync(examplePath, envPath);
  console.log('Created .env from .env.example');
} else if (!fs.existsSync(examplePath)) {
  console.warn('.env.example not found; nothing to do');
} else {
  console.log('.env already exists; not overwriting');
}
