export class CustomerApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function customerApi(
  path: string,
  body: unknown,
  getToken: () => Promise<string | null>,
  panelPassword?: string,
) {
  const token = await getToken();
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(panelPassword ? { "X-Panel-Password": panelPassword } : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new CustomerApiError(
      data?.error ||
        "Connection interrupted. Please try again; nothing is confirmed.",
      response.status,
    );
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw new CustomerApiError(
      "The service returned an unexpected response. Nothing has been confirmed; please try again.",
      502,
    );
  return data;
}
