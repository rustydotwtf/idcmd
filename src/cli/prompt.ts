const decoder = new TextDecoder();
const stdinReader = Bun.stdin.stream().getReader();

let buffered = "";

const popLineFromBuffer = (): string | null => {
  const idx = buffered.indexOf("\n");
  if (idx === -1) {
    return null;
  }

  const line = buffered.slice(0, idx).replaceAll(/\r$/g, "");
  buffered = buffered.slice(idx + 1);
  return line;
};

const readLine = (question: string): Promise<string> => {
  process.stdout.write(question);
  return readLineFromStdin();
};

const readLineFromStdin = async (): Promise<string> => {
  const existing = popLineFromBuffer();
  if (existing !== null) {
    return existing;
  }

  while (true) {
    const line = await readLineAfterChunk();
    if (line !== null) {
      return line;
    }
  }
};

const readNextChunk = async (): Promise<Uint8Array | null> => {
  const { done, value } = await stdinReader.read();
  return done ? null : value;
};

const readLineAfterChunk = async (): Promise<string | null> => {
  const chunk = await readNextChunk();
  if (!chunk) {
    return flushTail();
  }

  buffered += decoder.decode(chunk);
  return popLineFromBuffer();
};

const flushTail = (): string => {
  const tail = buffered;
  buffered = "";
  return tail.replaceAll(/\r$/g, "");
};

export const promptText = async (
  question: string,
  defaultValue: string
): Promise<string> => {
  const raw = await readLine(`${question} (${defaultValue}): `);
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : defaultValue;
};

export const promptOptionalText = async (
  question: string,
  defaultValue = ""
): Promise<string> => {
  const suffix = defaultValue ? ` (${defaultValue})` : "";
  const raw = await readLine(`${question}${suffix}: `);
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : defaultValue;
};

export interface PromptSelectOption<T extends string> {
  label: string;
  value: T;
}

const parseNumericChoice = (
  raw: string,
  optionsLength: number
): number | null => {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) {
    return null;
  }
  const index = parsed - 1;
  if (index < 0 || index >= optionsLength) {
    return null;
  }
  return index;
};

const findOptionByValue = <T extends string>(
  options: readonly PromptSelectOption<T>[],
  raw: string
): PromptSelectOption<T> | null => {
  const direct = options.find((option) => option.value === raw);
  return direct ?? null;
};

const getDefaultOptionIndex = <T extends string>(
  options: readonly PromptSelectOption<T>[],
  defaultValue: T
): number => {
  if (options.length === 0) {
    throw new Error("promptSelect requires at least one option.");
  }
  const defaultIndex = options.findIndex(
    (option) => option.value === defaultValue
  );
  if (defaultIndex === -1) {
    throw new Error(
      `promptSelect default value "${defaultValue}" is not in options.`
    );
  }
  return defaultIndex;
};

const printSelectPrompt = <T extends string>(args: {
  defaultIndex: number;
  options: readonly PromptSelectOption<T>[];
  question: string;
}): void => {
  process.stdout.write(`${args.question}\n`);
  for (const [index, option] of args.options.entries()) {
    const suffix = index === args.defaultIndex ? " (default)" : "";
    process.stdout.write(`  ${String(index + 1)}. ${option.label}${suffix}\n`);
  }
};

const resolveSelectedValue = <T extends string>(args: {
  defaultValue: T;
  input: string;
  options: readonly PromptSelectOption<T>[];
}): T | null => {
  if (args.input.length === 0) {
    return args.defaultValue;
  }
  const numericChoice = parseNumericChoice(args.input, args.options.length);
  if (numericChoice !== null) {
    return args.options[numericChoice]?.value ?? args.defaultValue;
  }
  const valueChoice = findOptionByValue(args.options, args.input);
  return valueChoice?.value ?? null;
};

const readSelection = async <T extends string>(args: {
  defaultIndex: number;
  defaultValue: T;
  options: readonly PromptSelectOption<T>[];
}): Promise<T> => {
  while (true) {
    const input = await readLine(
      `Select [1-${String(args.options.length)}] (${String(args.defaultIndex + 1)}): `
    );
    const value = resolveSelectedValue({
      defaultValue: args.defaultValue,
      input: input.trim(),
      options: args.options,
    });
    if (value !== null) {
      return value;
    }
    process.stdout.write("Invalid selection. Enter a number from the list.\n");
  }
};

export const promptSelect = <T extends string>(
  question: string,
  options: readonly PromptSelectOption<T>[],
  defaultValue: T
): Promise<T> => {
  const defaultIndex = getDefaultOptionIndex(options, defaultValue);
  printSelectPrompt({ defaultIndex, options, question });
  return readSelection({ defaultIndex, defaultValue, options });
};
