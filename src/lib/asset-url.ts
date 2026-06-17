/**
 * Prefix a same-origin ABSOLUTE path with the deployment basePath so runtime
 * fetch/tile/source URLs resolve under a GitHub Pages project path (e.g. /econmap).
 *
 * Use ONLY for paths the app builds itself at runtime and hands to:
 *   fetch(), maplibre source.data / tiles[], source.setData(), new URL(), <img src>.
 * Do NOT use on next/link <Link href>, next/router, next/image, or /_next/* URLs —
 * Next prefixes those automatically; double-prefixing would 404.
 *
 * Input must start with "/". Relative paths and full http(s) URLs are returned
 * unchanged, and an already-prefixed path is returned unchanged (idempotent guard).
 * In dev/test BASE_PATH is "" so this is a pure pass-through and changes nothing.
 */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function assetUrl(path: string): string {
  if (!path.startsWith("/")) return path; // relative or full URL — leave alone
  if (BASE_PATH && path.startsWith(`${BASE_PATH}/`)) return path; // already prefixed — idempotent
  return BASE_PATH ? `${BASE_PATH}${path}` : path;
}
