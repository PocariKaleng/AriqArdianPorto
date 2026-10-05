const filenameToken = /(?:^|\s)(?:filename|title)=(?:"([^"]*)"|'([^']*)'|(\S+))/;

export function cleanCodeFilename(value: string) {
  return value.replace(/[\x00-\x1f\x7f"'`]/g, '').trim().slice(0, 160);
}

export function codeFilename(meta = '') {
  const match = meta.match(filenameToken);
  if (match) return cleanCodeFilename(match[1] ?? match[2] ?? match[3]);
  return /^\S+\.[\w+-]+$/.test(meta.trim()) ? cleanCodeFilename(meta) : '';
}

export function codeFileMeta(meta: string, filename: string) {
  const name = cleanCodeFilename(filename);
  if (name === codeFilename(meta)) return meta;
  const remaining = codeFilename(meta) === meta.trim() ? '' : meta.replace(filenameToken, '').trim();
  return [remaining, name ? `filename="${name}"` : ''].filter(Boolean).join(' ');
}
