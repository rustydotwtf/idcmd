/* eslint-disable no-console */

import type { ParsedArgs } from "./args";

import { parseArgs } from "./args";
import { buildCommand } from "./commands/build";
import { deployCommand } from "./commands/deploy";
import { devCommand } from "./commands/dev";
import { initCommand } from "./commands/init";
import { previewCommand } from "./commands/preview";
import { parsePort } from "./normalize";
import { readPackageVersion } from "./version";

const DEFAULT_PREVIEW_PORT = 4173;

const usage = (): string =>
  [
    "idcmd",
    "",
    "Usage:",
    "  idcmd init [dir] [--yes] [--name <name>] [--description <text>] [--base-url <url>] [--port <port>] [--no-git]",
    "  idcmd dev [--port <port>]",
    "  idcmd build",
    "  idcmd preview [--port <port>]",
    "  idcmd deploy",
    "",
  ].join("\n");

const asStringFlag = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const handleInit = (parsed: ParsedArgs): Promise<number> => {
  const [dir] = parsed.positionals;
  return initCommand(dir, parsed.flags);
};

const handleDev = (parsed: ParsedArgs): Promise<number> =>
  devCommand({ port: asStringFlag(parsed.flags.port) });

const handleBuild = (): Promise<number> => buildCommand();

const handlePreview = (parsed: ParsedArgs): Promise<number> => {
  const port = parsePort(parsed.flags.port, DEFAULT_PREVIEW_PORT);
  return previewCommand(port);
};

const handleDeploy = (): Promise<number> => deployCommand();

const handlers: Record<string, (parsed: ParsedArgs) => Promise<number>> = {
  build: () => handleBuild(),
  deploy: () => handleDeploy(),
  dev: (parsed) => handleDev(parsed),
  init: (parsed) => handleInit(parsed),
  preview: (parsed) => handlePreview(parsed),
};

const isHelpCommand = (cmd: string | null): boolean =>
  !cmd || cmd === "--help" || cmd === "-h";

const isVersionCommand = (cmd: string): boolean =>
  cmd === "--version" || cmd === "-v";

export const main = async (argv: string[]): Promise<void> => {
  try {
    const code = await runMain(argv);
    process.exit(code);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  }
};

const runMain = async (argv: string[]): Promise<number> => {
  const parsed = parseArgs(argv);
  const cmd = parsed.command;

  const metaCode = await maybeHandleMetaCommand(cmd);
  if (metaCode !== null) {
    return metaCode;
  }

  const handler = resolveCommandHandler(cmd);
  if (!handler) {
    return handleUnknownCommand(cmd);
  }

  return handler(parsed);
};

const maybeHandleMetaCommand = async (
  cmd: string | null
): Promise<number | null> => {
  if (isHelpCommand(cmd)) {
    console.log(usage());
    return 0;
  }

  if (cmd && isVersionCommand(cmd)) {
    console.log(await readPackageVersion());
    return 0;
  }

  return null;
};

const resolveCommandHandler = (
  cmd: string | null
): ((parsed: ParsedArgs) => Promise<number>) | null => {
  if (!cmd) {
    return null;
  }
  return handlers[cmd] ?? null;
};

const handleUnknownCommand = (cmd: string | null): number => {
  console.error(`Unknown command: ${cmd ?? "(none)"}`);
  console.log(usage());
  return 1;
};
