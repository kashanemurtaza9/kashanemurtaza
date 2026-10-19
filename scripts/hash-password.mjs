// Usage: npm run hash-password -- "your password"      (or run it and type the password when asked)
import crypto from 'node:crypto';
import readline from 'node:readline';

async function ask() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((r) => rl.question('Admin password (min 12 characters): ', (a) => { rl.close(); r(a); }));
}
const pw = process.argv[2] || await ask();
if (!pw || pw.length < 12) { console.error('Use a password with at least 12 characters.'); process.exit(1); }
const N = 16384, r = 8, p = 1;
const salt = crypto.randomBytes(16);
const hash = crypto.scryptSync(pw, salt, 64, { N, r, p, maxmem: 256 * 1024 * 1024 });
console.log('\nADMIN_PASSWORD_HASH=' + ['scrypt', N, r, p, salt.toString('base64'), hash.toString('base64')].join('$'));
console.log('SESSION_SECRET=' + crypto.randomBytes(32).toString('hex'));
console.log('\nPaste both lines into your Vercel environment variables (or .env for local development). Do not commit them.');
