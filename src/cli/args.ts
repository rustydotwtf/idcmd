export interface ParsedArgs {
  command: string | null;
  flags: Record<string, string | boolean>;
  positionals: string[];
}

const isFlagToken = (token: string): boolean => token.startsWith("--");

const parseFlagToken = (
  token: string,
  next: string | undefined
): { consumed: number; key: string; value: string | boolean } => {
  if (token.startsWith("--no-")) {
    return { consumed: 1, key: token.slice("--no-".length), value: false };
  }

  const eq = token.indexOf("=");
  if (eq !== -1) {
    return {
      consumed: 1,
      key: token.slice(2, eq),
      value: token.slice(eq + 1),
    };
  }

  const key = token.slice(2);
  if (next && !isFlagToken(next)) {
    return { consumed: 2, key, value: next };
  }

  return { consumed: 1, key, value: true };
};

export const parseArgs = (argv: string[]): ParsedArgs => {
  const { flags, positionals } = parseArgv(argv);
  const [command, ...rest] = positionals;
  return { command: command ?? null, flags, positionals: rest };
};

const parseArgv = (
  argv: string[]
): { flags: Record<string, string | boolean>; positionals: string[] } => {
  const flags: Record<string, string | boolean> = {};
  const positionals: string[] = [];

  let i = 0;
  while (i < argv.length) {
    i = consumeArg(argv, i, flags, positionals);
  }

  return { flags, positionals };
};

const consumeArg = (
  argv: string[],
  index: number,
  flags: Record<string, string | boolean>,
  positionals: string[]
): number => {
  const token = argv[index];
  if (!token) {
    return argv.length;
  }

  if (!isFlagToken(token)) {
    return consumePositional(argv, index, positionals);
  }

  return consumeFlag(argv, index, token, flags);
};

const consumePositional = (
  argv: string[],
  index: number,
  positionals: string[]
): number => {
  const token = argv[index];
  if (!token) {
    return argv.length;
  }

  if (token === "--") {
    positionals.push(...argv.slice(index + 1));
    return argv.length;
  }

  positionals.push(token);
  return index + 1;
};

const consumeFlag = (
  argv: string[],
  index: number,
  token: string,
  flags: Record<string, string | boolean>
): number => {
  const next = argv[index + 1];
  const parsed = parseFlagToken(token, next);
  flags[parsed.key] = parsed.value;
  return index + parsed.consumed;
};
