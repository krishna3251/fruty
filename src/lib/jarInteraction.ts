// Observed lid footage: lid raised at 6.5 s, seated at 7.5 s.
export const JAR_CLOSED_TIME = 7.5;
export const JAR_OPEN_TIME = 6.5;
export function jarTime(openness: number) {
  const value = Number.isFinite(openness)
    ? Math.min(100, Math.max(0, openness))
    : 0;
  return JAR_CLOSED_TIME - (value / 100) * (JAR_CLOSED_TIME - JAR_OPEN_TIME);
}
export function dragOpenness(
  start: number,
  startY: number,
  currentY: number,
  distance: number,
) {
  return Math.min(
    100,
    Math.max(0, start + ((startY - currentY) / Math.max(1, distance)) * 100),
  );
}
