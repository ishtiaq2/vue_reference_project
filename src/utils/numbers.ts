/** Parses a positive integer, falling back when the value is missing or invalid. */
export function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined) return fallback
  const parsed = Number.parseInt(raw, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}
