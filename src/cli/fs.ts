import { dirname, joinPath } from "./path";

export const ensureDir = async (dir: string): Promise<void> => {
  const proc = Bun.spawn(["mkdir", "-p", dir], {
    stderr: "inherit",
    stdout: "ignore",
  });
  const code = await proc.exited;
  if (code !== 0) {
    throw new Error(`Failed to create directory: ${dir}`);
  }
};

export const copyDir = async (
  fromDir: string,
  toDir: string
): Promise<void> => {
  const glob = new Bun.Glob("**/*");

  for await (const relative of glob.scan(fromDir)) {
    const srcPath = joinPath(fromDir, relative);
    const dstPath = joinPath(toDir, relative);
    await ensureDir(dirname(dstPath));
    await Bun.write(dstPath, Bun.file(srcPath));
  }
};

export const replaceInFile = async (
  filePath: string,
  replacer: (text: string) => string
): Promise<void> => {
  const current = await Bun.file(filePath).text();
  const next = replacer(current);
  await Bun.write(filePath, next);
};

export const isDirEmpty = async (dir: string): Promise<boolean> => {
  const glob = new Bun.Glob("*");
  try {
    for await (const _entry of glob.scan(dir)) {
      return false;
    }
    return true;
  } catch {
    return true;
  }
};
