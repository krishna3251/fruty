type Method = (request: Request) => Response | Promise<Response>;

// Adapts the method-named handlers in api/ to a single Netlify Function.
export function dispatch(methods: Partial<Record<"GET" | "POST", Method>>) {
  return async (request: Request) => {
    const method = request.method === "HEAD" ? "GET" : request.method;
    const handler = methods[method as "GET" | "POST"];
    if (!handler)
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: {
          Allow: Object.keys(methods).join(", "),
          "Content-Type": "application/json",
        },
      });
    return handler(request);
  };
}
