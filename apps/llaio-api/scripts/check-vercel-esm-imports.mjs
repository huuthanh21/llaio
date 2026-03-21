import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const apiDir = new URL("../api", import.meta.url);
const importPattern = /from\s+"(\.\.\/src\/[^"\n]+)"/g;

const violations = [];

for (const entry of readdirSync(apiDir)) {
  if (!entry.endsWith(".ts") || entry.endsWith(".test.ts")) {
    continue;
  }

  const filePath = join(apiDir.pathname, entry);
  const source = readFileSync(filePath, "utf8");

  let match;
  while ((match = importPattern.exec(source)) !== null) {
    const importPath = match[1];
    if (!importPath.endsWith(".js")) {
      violations.push(`${entry}: ${importPath}`);
    }
  }
}

if (violations.length > 0) {
  console.error("Found extensionless ../src imports in api handlers:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log("OK: all api handler ../src imports use .js extensions");
