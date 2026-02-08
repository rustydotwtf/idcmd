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
