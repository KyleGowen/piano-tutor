import { networkInterfaces } from 'node:os';

export function isPrivateAddress(address = '') {
  const ip = address.replace(/^::ffff:/, '');
  return (
    ip === '::1' ||
    /^(127\.|10\.|192\.168\.|169\.254\.)/.test(ip) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    /^(fc|fd|fe80:)/i.test(ip)
  );
}
export function networkAddresses() {
  return [
    ...new Set(
      Object.values(networkInterfaces())
        .flat()
        .filter(
          (entry) =>
            entry && entry.family === 'IPv4' && !entry.internal && isPrivateAddress(entry.address),
        )
        .map((entry) => entry.address),
    ),
  ];
}
