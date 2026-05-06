/**
 * @file src/utils/helpers.js
 * @description Shared, stateless utility functions.
 */

// ─── Object helpers ───────────────────────────────────────────────────────────

/**
 * Build a new object that contains only the keys in the `allowlist`.
 * Useful for sanitising untrusted update payloads before persisting them.
 *
 * @template {string} K
 * @param {Record<string, unknown>} obj    - Source object (e.g. GraphQL args)
 * @param {K[]}                    keys   - Allowed keys
 * @returns {Partial<Record<K, unknown>>}
 *
 * @example
 * pickAllowed({ name: 'Alice', role: 'admin' }, ['name'])
 * // → { name: 'Alice' }
 */
export function pickAllowed(obj, keys) {
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => keys.includes(k)),
  );
}

/**
 * Convert a camelCase key map to snake_case using an explicit mapping table.
 * Only keys present in `mapping` are included in the output — unknown keys
 * are silently dropped, which doubles as an allowlist.
 *
 * @param {Record<string, unknown>} input
 * @param {Record<string, string>}  mapping  - { camelKey: 'snake_key' }
 * @returns {Record<string, unknown>}
 *
 * @example
 * mapKeys({ firstName: 'Bob' }, { firstName: 'first_name' })
 * // → { first_name: 'Bob' }
 */
export function mapKeys(input, mapping) {
  const result = {};
  for (const [camel, snake] of Object.entries(mapping)) {
    if (input[camel] !== undefined) result[snake] = input[camel];
  }
  return result;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** @returns {string} Current UTC timestamp as ISO-8601 string */
export const nowISO = () => new Date().toISOString();

/**
 * Returns an ISO-8601 timestamp `ms` milliseconds from now.
 * @param {number} ms
 * @returns {string}
 */
export const futureISO = (ms) => new Date(Date.now() + ms).toISOString();

// ─── Misc ─────────────────────────────────────────────────────────────────────

/** Generate a random 6-digit OTP string. */
export const generateOtp = () =>
  Math.floor(100_000 + Math.random() * 900_000).toString();
