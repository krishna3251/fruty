export type CartItems = Record<string, number>;
export const MAX_QUANTITY = 20;
export function restoreCart(
  raw: string | null,
  availableIds: string[],
): CartItems {
  try {
    const data: unknown = JSON.parse(raw || "{}");
    if (!data || typeof data !== "object" || Array.isArray(data)) return {};
    return Object.fromEntries(
      Object.entries(data).filter(
        ([id, n]) =>
          availableIds.includes(id) &&
          typeof n === "number" &&
          Number.isInteger(n) &&
          n > 0 &&
          n <= MAX_QUANTITY,
      ),
    );
  } catch {
    return {};
  }
}
export function changeQuantity(
  items: CartItems,
  id: string,
  delta: number,
): CartItems {
  const next = { ...items };
  const quantity = Math.min(MAX_QUANTITY, Math.max(0, (next[id] || 0) + delta));
  if (quantity === 0) delete next[id];
  else next[id] = quantity;
  return next;
}
