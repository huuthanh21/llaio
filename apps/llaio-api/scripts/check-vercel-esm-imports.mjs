import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const apiDir = new URL("../api", import.meta.url);
const srcDir = new URL("../src", import.meta.url);
const relativeImportPattern = /(?:from\s+|import\s+")((?:\.\/|\.\.\/)[^"\n]+)"/g;

const violations = [];

function checkDirectory(url, label) {
  for (const entry of readdirSync(url)) {
    if (!entry.endsWith(".ts") || entry.endsWith(".test.ts")) {
      continue;
    }

    const filePath = join(url.pathname, entry);
    const source = readFileSync(filePath, "utf8");

    relativeImportPattern.lastIndex = 0;
    let match;
    while ((match = relativeImportPattern.exec(source)) !== null) {
      const importPath = match[1];
      if (!importPath.endsWith(".js")) {
        violations.push(`${label}/${entry}: ${importPath}`);
      }
    }
  }
}

checkDirectory(apiDir, "api");
checkDirectory(srcDir, "src");

if (violations.length > 0) {
  console.error("Found extensionless relative imports in runtime TS files:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log("OK: runtime relative imports use .js extensions");
