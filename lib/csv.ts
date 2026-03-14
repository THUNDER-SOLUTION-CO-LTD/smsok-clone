const CSV_FORMULA_PREFIX = /^[=+\-@\t\r\n]/;

function normalizeCsvValue(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (value == null) return "";
  return String(value);
}

export function neutralizeCsvFormula(value: unknown): string {
  const normalized = normalizeCsvValue(value);
  return CSV_FORMULA_PREFIX.test(normalized) ? `'${normalized}` : normalized;
}

export function toCsvCell(value: unknown): string {
  const normalized = neutralizeCsvFormula(value);
  return `"${normalized.replace(/"/g, '""')}"`;
}
