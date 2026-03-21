import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const runtimeDirs = [
  { path: join(import.meta.dir, "../api"), label: "api" },
  { path: import.meta.dir, label: "src" },
];

const relativeImportPattern = /(?:from\s+|import\s+")((?:\.\/|\.\.\/)[^"\n]+)"/g;

function findExtensionlessImports(): string[] {
  const violations: string[] = [];

  for (const directory of runtimeDirs) {
    for (const entry of readdirSync(directory.path)) {
      if (!entry.endsWith(".ts") || entry.endsWith(".test.ts")) {
        continue;
      }

      const filePath = join(directory.path, entry);
      const source = readFileSync(filePath, "utf8");

      relativeImportPattern.lastIndex = 0;
      let match;
      while ((match = relativeImportPattern.exec(source)) !== null) {
        const importPath = match[1];
        if (!importPath) {
          continue;
        }

        if (!importPath.endsWith(".js")) {
          violations.push(`${directory.label}/${entry}: ${importPath}`);
        }
      }
    }
  }

  return violations;
}

describe("runtime relative imports", () => {
  it("uses .js extensions for Node ESM compatibility", () => {
    const violations = findExtensionlessImports();
    expect(violations).toEqual([]);
  });
});
