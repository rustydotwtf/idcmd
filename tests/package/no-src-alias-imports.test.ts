import { describe, expect, it } from "bun:test";

const aliasImportPattern =
  /(from\s+["']@\/)|(import\s*\(\s*["']@\/)|(require\s*\(\s*["']@\/)/;

const scanFiles = async (): Promise<string[]> => {
  const files = new Set<string>();

  for await (const path of new Bun.Glob("src/**/*.ts").scan(".")) {
    files.add(path);
  }

  for await (const path of new Bun.Glob("src/**/*.tsx").scan(".")) {
    files.add(path);
  }

  return [...files].toSorted();
};

describe("package source", () => {
  it("does not use @/ alias imports under src/", async () => {
    const files = await scanFiles();
    const scanned = await Promise.all(
      files.map(async (filePath) => ({
        filePath,
        text: await Bun.file(filePath).text(),
      }))
    );

    const offenders = scanned
      .filter(({ text }) => aliasImportPattern.test(text))
      .map(({ filePath }) => filePath);

    expect(offenders).toEqual([]);
  });
});
