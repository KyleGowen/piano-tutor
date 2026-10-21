import { createServer as httpServer } from 'node:http';
import { createServer as httpsServer } from 'node:https';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isPrivateAddress, networkAddresses } from './network.mjs';

const project = fileURLToPath(new URL('..', import.meta.url));
const root = resolve(project, 'dist');
const certs = resolve(project, '.certs');
const port = Number(process.env.PORT || 5173);
const httpsPort = Number(process.env.HTTPS_PORT || 5443);
if (!existsSync(resolve(root, 'index.html'))) {
  console.error('Build the app first: npm run build');
  process.exit(1);
}
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.cer': 'application/x-x509-ca-cert',
};
const handler = (request, response) => {
  if (!isPrivateAddress(request.socket.remoteAddress)) {
    response.writeHead(403);
    response.end('Home network access only.');
    return;
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end();
    return;
  }
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const publicCertificate = pathname === '/setup/piano-tutor-root.cer';
    const file = publicCertificate
      ? resolve(certs, 'piano-tutor-root.cer')
      : resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (
      (!publicCertificate && !file.startsWith(`${root}/`)) ||
      !existsSync(file) ||
      !statSync(file).isFile()
    ) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }
    response.writeHead(200, {
      'Content-Type': mime[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Permissions-Policy': 'microphone=(self), camera=()',
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
      ...(publicCertificate
        ? { 'Content-Disposition': 'attachment; filename="piano-tutor-root.cer"' }
        : {}),
    });
    response.end(request.method === 'HEAD' ? undefined : readFileSync(file));
  } catch {
    response.writeHead(400);
    response.end('Invalid request');
  }
};
const servers = [];
const launch = (server, listenPort, protocol) => {
  server.on('error', (error) => {
    console.error(`${protocol} could not start: ${error.message}`);
    servers.forEach((s) => s.close());
    process.exitCode = 1;
  });
  servers.push(server);
  server.listen(listenPort, '0.0.0.0', () => {
    console.log(`  This computer: ${protocol}://localhost:${listenPort}`);
    networkAddresses().forEach((ip) =>
      console.log(`  Home network:  ${protocol}://${ip}:${listenPort}`),
    );
  });
};
console.log('Piano Tutor · keep this window running; Ctrl+C stops the app.');
launch(httpServer(handler), port, 'http');
if (existsSync(resolve(certs, 'server-key.pem')) && existsSync(resolve(certs, 'server.pem'))) {
  launch(
    httpsServer(
      {
        key: readFileSync(resolve(certs, 'server-key.pem')),
        cert: readFileSync(resolve(certs, 'server.pem')),
      },
      handler,
    ),
    httpsPort,
    'https',
  );
} else console.log('Phone microphone setup: npm run setup:https (see README).');
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    servers.forEach((server) => server.close());
  });
