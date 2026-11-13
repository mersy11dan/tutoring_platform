import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

function filesUnder(directory: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(directory)) {
    const full = path.join(directory, entry);
    if (statSync(full).isDirectory()) found.push(...filesUnder(full));
    else if (/\.(tsx|css)$/.test(entry)) found.push(full);
  }
  return found;
}

describe("solid colors", () => {
  it("does not use gradient fills in the interface", () => {
    const files = filesUnder("src");
    assert.ok(files.length > 0);
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      assert.equal(/gradient/i.test(text), false, file);
    }
  });
});
