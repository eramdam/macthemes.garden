const CDN = import.meta.env.PROD ? "https://cdn.macthemes.garden" : "";

export function cdn(path: string) {
  return `${CDN}${path}`;
}
