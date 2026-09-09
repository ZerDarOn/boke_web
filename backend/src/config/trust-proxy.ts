import { isIP } from 'node:net';

export type TrustProxySetting = string | number;

const DEFAULT_TRUST_PROXY = 'loopback';
const MIN_IPV4_CIDR_PREFIX = 24;
const MIN_IPV6_CIDR_PREFIX = 64;

/**
 * Resolve Express' trust proxy setting without ever accepting a blanket trust.
 *
 * - Default: trust only a proxy connected through this host's loopback interface.
 * - `0`: disable proxy trust.
 * - Otherwise, accept only loopback plus explicit proxy IPs or narrow CIDRs.
 * Numeric hop counts and broad private-network aliases are intentionally rejected:
 * either can let a client on a shorter/direct path spoof X-Forwarded-For.
 */
export function resolveTrustProxySetting(rawValue?: string): TrustProxySetting {
  const value = rawValue?.trim();
  if (!value) return DEFAULT_TRUST_PROXY;
  if (value === '0') return 0;

  const boundaries = value.split(',').map(boundary => boundary.trim().toLowerCase());
  for (const boundary of boundaries) {
    if (!boundary) {
      throw new Error('TRUST_PROXY contains an empty proxy boundary');
    }
    if (boundary === 'loopback') continue;

    const [address, rawPrefix, ...extra] = boundary.split('/');
    const family = isIP(address);
    if (family === 0 || extra.length > 0) {
      throw new Error('TRUST_PROXY accepts only loopback, exact IPs, or narrow CIDRs');
    }
    if (rawPrefix === undefined) continue;

    if (!/^\d+$/.test(rawPrefix)) {
      throw new Error('TRUST_PROXY CIDR prefix must be numeric');
    }
    const prefix = Number(rawPrefix);
    const minimum = family === 4 ? MIN_IPV4_CIDR_PREFIX : MIN_IPV6_CIDR_PREFIX;
    const maximum = family === 4 ? 32 : 128;
    if (prefix < minimum || prefix > maximum) {
      throw new Error(`TRUST_PROXY CIDR must be /${minimum} or narrower for IPv${family}`);
    }
  }

  return [...new Set(boundaries)].join(', ');
}
