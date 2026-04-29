// Shared display formatters for any list/table view

export function useFormatters() {
  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '-'
  const m2o = (f) => Array.isArray(f) ? f[1] : (f || '-')   // many2one → display name
  const num = (n) => n != null ? Number(n).toFixed(2) : '-'
  return { fmt, m2o, num }
}
