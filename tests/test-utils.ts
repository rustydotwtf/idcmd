export const requireResponse = (
  response: Response | undefined,
  message = "Expected response to be defined"
): Response => {
  if (!response) {
    throw new Error(message);
  }

  return response;
};

export const isSorted = (values: string[]): boolean => {
  let previous: string | undefined;

  for (const current of values) {
    if (previous !== undefined && previous > current) {
      return false;
    }
    previous = current;
  }

  return true;
};

export const joinPath = (...parts: string[]): string => {
  let out = "";
  for (const part of parts) {
    if (!part) {
      continue;
    }
    if (part.startsWith("/")) {
      out = part.replaceAll(/\/+$/g, "");
      continue;
    }
    const next = part.replaceAll(/^\/+/g, "").replaceAll(/\/+$/g, "");
    out = out.length === 0 ? next : `${out}/${next}`;
  }
  return out.length === 0 ? "." : out;
};

export const dirname = (path: string): string => {
  const normalized = path.replaceAll(/\/+$/g, "");
  const idx = normalized.lastIndexOf("/");
  return idx <= 0 ? "." : normalized.slice(0, idx);
};

export const ensureDir = async (dir: string): Promise<void> => {
  const proc = Bun.spawn(["mkdir", "-p", dir], {
    stderr: "ignore",
    stdout: "ignore",
  });
  const code = await proc.exited;
  if (code !== 0) {
    throw new Error(`Failed to create dir: ${dir}`);
  }
};

export const createTempDir = async (prefix: string): Promise<string> => {
  const base = process.env.TMPDIR ?? "/tmp";
  const dir = joinPath(base, `${prefix}${crypto.randomUUID()}`);
  await ensureDir(dir);
  return dir;
};

export const fileExists = (path: string): Promise<boolean> =>
  Bun.file(path).exists();

export const readTextFile = (path: string): Promise<string> =>
  Bun.file(path).text();

export const writeTextFile = async (
  path: string,
  text: string
): Promise<void> => {
  await ensureDir(dirname(path));
  await Bun.write(path, text);
};
