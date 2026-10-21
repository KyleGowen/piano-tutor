import { mkdirSync, existsSync, writeFileSync, chmodSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { hostname } from 'node:os';
import { fileURLToPath } from 'node:url';
import { networkAddresses } from './network.mjs';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));
const run = (args) => execFileSync('openssl', args, { stdio: ['ignore', 'ignore', 'pipe'] });
mkdirSync('.certs', { recursive: true, mode: 0o700 });
try {
  if (!existsSync('.certs/root.pem') || !existsSync('.certs/root-key.pem')) {
    if (existsSync('.certs/root.pem') || existsSync('.certs/root-key.pem'))
      throw new Error('The local CA is incomplete. Restore its missing file before continuing.');
    writeFileSync(
      '.certs/root.cnf',
      '[req]\ndistinguished_name=dn\nx509_extensions=ca\nprompt=no\n[dn]\nCN=Piano Tutor Local CA\n[ca]\nbasicConstraints=critical,CA:TRUE\nkeyUsage=critical,keyCertSign,cRLSign\nsubjectKeyIdentifier=hash\n',
    );
    run([
      'req',
      '-x509',
      '-newkey',
      'rsa:3072',
      '-nodes',
      '-days',
      '3650',
      '-keyout',
      '.certs/root-key.pem',
      '-out',
      '.certs/root.pem',
      '-config',
      '.certs/root.cnf',
    ]);
    chmodSync('.certs/root-key.pem', 0o600);
  }
  const ips = networkAddresses();
  const localName = hostname();
  const names = ['localhost', ...(/^[a-z0-9.-]+$/i.test(localName) ? [localName] : [])];
  const sans = [
    ...names.map((name) => `DNS:${name}`),
    'IP:127.0.0.1',
    'IP:::1',
    ...ips.map((ip) => `IP:${ip}`),
  ];
  writeFileSync(
    '.certs/server.ext',
    `subjectAltName=${sans.join(',')}\nbasicConstraints=critical,CA:FALSE\nkeyUsage=critical,digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\nauthorityKeyIdentifier=keyid,issuer\n`,
  );
  run([
    'req',
    '-newkey',
    'rsa:2048',
    '-nodes',
    '-keyout',
    '.certs/server-key.pem',
    '-out',
    '.certs/server.csr',
    '-subj',
    '/CN=Piano Tutor',
  ]);
  chmodSync('.certs/server-key.pem', 0o600);
  run([
    'x509',
    '-req',
    '-in',
    '.certs/server.csr',
    '-CA',
    '.certs/root.pem',
    '-CAkey',
    '.certs/root-key.pem',
    '-CAcreateserial',
    '-out',
    '.certs/server.pem',
    '-days',
    '365',
    '-sha256',
    '-extfile',
    '.certs/server.ext',
  ]);
  // Public certificate only. This is the file a phone installs and trusts.
  run(['x509', '-in', '.certs/root.pem', '-outform', 'DER', '-out', '.certs/piano-tutor-root.cer']);
  console.log('Local HTTPS certificates are ready. No system trust settings were changed.');
  console.log(
    'Run npm start. Install and trust the public .certs/piano-tutor-root.cer on each phone (README instructions).',
  );
  console.log('Never share the files ending in -key.pem. They remain ignored by Git.');
  console.log(`HTTPS names: ${[...names, ...ips].join(', ')}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
