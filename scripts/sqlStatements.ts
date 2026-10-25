// Split trusted, versioned migration SQL without splitting PL/pgSQL dollar bodies.
export function sqlStatements(source: string) {
  const statements: string[] = [];
  let start = 0;
  let quote = "";
  let dollar = "";
  let line = false;
  let block = 0;
  for (let i = 0; i < source.length; i++) {
    const c = source[i],
      next = source[i + 1];
    if (line) {
      if (c === "\n") line = false;
      continue;
    }
    if (block) {
      if (c === "/" && next === "*") {
        block++;
        i++;
      } else if (c === "*" && next === "/") {
        block--;
        i++;
      }
      continue;
    }
    if (dollar) {
      if (source.startsWith(dollar, i)) {
        i += dollar.length - 1;
        dollar = "";
      }
      continue;
    }
    if (quote) {
      if (c === quote) {
        if (next === quote) i++;
        else quote = "";
      }
      continue;
    }
    if (c === "-" && next === "-") {
      line = true;
      i++;
      continue;
    }
    if (c === "/" && next === "*") {
      block = 1;
      i++;
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c;
      continue;
    }
    if (c === "$") {
      const match = source.slice(i).match(/^\$(?:[a-zA-Z_][a-zA-Z0-9_]*)?\$/);
      if (match) {
        dollar = match[0];
        i += dollar.length - 1;
        continue;
      }
    }
    if (c === ";") {
      const statement = source.slice(start, i).trim();
      if (statement) statements.push(statement);
      start = i + 1;
    }
  }
  if (quote || dollar || block)
    throw Error("Unterminated SQL migration literal or comment.");
  const remaining = source.slice(start).trim();
  if (remaining) statements.push(remaining);
  return statements;
}
