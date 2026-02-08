export interface RunOptions {
  cwd?: string;
  env?: Record<string, string>;
}

export const run = (
  cmd: string[],
  options: RunOptions = {}
): Promise<number> => {
  const child = Bun.spawn(cmd, {
    cwd: options.cwd,
    env: { ...process.env, ...options.env },
    stderr: "inherit",
    stdout: "inherit",
  });
  return child.exited;
};
