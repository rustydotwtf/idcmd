/* eslint-disable no-console */

import type { ParsedArgs } from "./args";

import { parseArgs } from "./args";
import { buildCommand } from "./commands/build";
import { clientCommand } from "./commands/client";
import { deployCommand } from "./commands/deploy";
import { devCommand } from "./commands/dev";
import { initCommand } from "./commands/init";
import { previewCommand } from "./commands/preview";
import { parsePort } from "./normalize";
import { readPackageVersion } from "./version";

const DEFAULT_PREVIEW_PORT = 4173;
const DEFAULT_DEV_PORT = 4000;

type CommandName = "init" | "dev" | "build" | "preview" | "deploy" | "client";

const isCommandName = (value: string): value is CommandName =>
  value === "init" ||
  value === "dev" ||
  value === "build" ||
  value === "preview" ||
  value === "deploy" ||
  value === "client";

const globalHelp = (): string =>
  [
    "idcmd",
    "",
    "Static docs site CLI optimized for agent workflows.",
    "",
    "Usage:",
    "  idcmd init [dir] [--yes] [--name <name>] [--description <text>] [--base-url <url>] [--port <port>] [--no-git] [--vercel|--fly|--railway]",
    "  idcmd dev [--port <port>]",
    "  idcmd build",
    "  idcmd preview [--port <port>]",
    "  idcmd deploy [--vercel|--fly|--railway]",
    "  idcmd client <add|update> <layout|right-rail|search-page|runtime|all> [--dry-run] [--yes]",
    "",
    "Agent Quickstart:",
    "  1. idcmd init my-docs --yes --no-git",
    "  2. cd my-docs && bun install",
    `  3. idcmd dev --port ${String(DEFAULT_DEV_PORT)}`,
    "  4. idcmd build",
    `  5. idcmd preview --port ${String(DEFAULT_PREVIEW_PORT)}`,
    "  6. idcmd deploy --vercel|--fly|--railway",
    "",
    "Commands:",
    "  init    Scaffold a new site in a target directory",
    "  dev     Run SSR server + Tailwind/runtime watchers",
    "  build   Generate static output in public/",
    "  preview Serve public/ locally with canonical routing",
    "  deploy  Build + generate provider config files",
    "  client  Add/update local UI/runtime baseline files",
    "",
    "Help:",
    "  idcmd --help",
    "  idcmd <command> --help",
    "  idcmd --version",
    "",
  ].join("\n");

const initHelp = (): string =>
  [
    "idcmd init",
    "",
    "Scaffold a new idcmd site from the default template.",
    "",
    "Usage:",
    "  idcmd init [dir] [--yes] [--name <name>] [--description <text>] [--base-url <url>] [--port <port>] [--no-git] [--vercel|--fly|--railway]",
    "",
    "Flags:",
    "  --yes              Non-interactive defaults",
    "  --name             Site name in site.jsonc",
    "  --description      Site description in site.jsonc",
    "  --base-url         Base URL for canonicals + sitemap",
    `  --port             Default dev script port (default: ${String(DEFAULT_DEV_PORT)})`,
    "  --no-git           Skip `git init` in target dir",
    "  --vercel           Generate vercel.json",
    "  --fly              Generate fly.toml + Docker files",
    "  --railway          Generate railway.json + Docker files",
    "",
    "Side effects:",
    "  - Writes template files into target directory",
    "  - Fails if target directory is not empty",
    "  - Runs `git init` unless --no-git is set",
    "",
    "Examples:",
    "  idcmd init my-docs --yes --no-git",
    "  idcmd init apps/docs --yes --base-url https://docs.example.com",
    "",
  ].join("\n");

const devHelp = (): string =>
  [
    "idcmd dev",
    "",
    "Run local development: SSR server + Tailwind + runtime bundling in watch mode.",
    "",
    "Usage:",
    "  idcmd dev [--port <port>]",
    "",
    "Flags:",
    `  --port             HTTP port (default: ${String(DEFAULT_DEV_PORT)})`,
    "",
    "Side effects:",
    "  - Writes compiled runtime scripts to public/_idcmd/*.js",
    "  - Writes compiled CSS to public/styles.css",
    "",
    "Examples:",
    "  idcmd dev",
    "  idcmd dev --port 4010",
    "",
  ].join("\n");

const buildHelp = (): string =>
  [
    "idcmd build",
    "",
    "Build static site output in public/.",
    "",
    "Usage:",
    "  idcmd build",
    "",
    "What it does:",
    "  - Compiles runtime assets from src/runtime/ to public/_idcmd/",
    "  - Builds Tailwind CSS to public/styles.css",
    "  - Renders markdown pages and metadata outputs (llms.txt, search index, sitemap/robots when baseUrl is set)",
    "",
    "Examples:",
    "  idcmd build",
    "",
  ].join("\n");

const previewHelp = (): string =>
  [
    "idcmd preview",
    "",
    "Serve generated public/ output locally with canonical route behavior.",
    "",
    "Usage:",
    "  idcmd preview [--port <port>]",
    "",
    "Flags:",
    `  --port             HTTP port (default: ${String(DEFAULT_PREVIEW_PORT)})`,
    "",
    "Notes:",
    "  - Requires public/index.html (run idcmd build first)",
    "",
    "Examples:",
    "  idcmd preview",
    "  idcmd preview --port 5000",
    "",
  ].join("\n");

const deployHelp = (): string =>
  [
    "idcmd deploy",
    "",
    "Build project and print provider-specific deployment guidance.",
    "",
    "Usage:",
    "  idcmd deploy [--vercel|--fly|--railway]",
    "",
    "Flags (choose one provider):",
    "  --vercel           Generate vercel.json",
    "  --fly              Generate fly.toml + Docker files",
    "  --railway          Generate railway.json + Docker files",
    "",
    "Side effects:",
    "  - Runs idcmd build first",
    "  - May write provider config files in project root",
    "",
    "Examples:",
    "  idcmd deploy --vercel",
    "  idcmd deploy --fly",
    "",
  ].join("\n");

const clientHelp = (): string =>
  [
    "idcmd client",
    "",
    "Copy baseline local implementation files into src/ui/ and src/runtime/.",
    "",
    "Usage:",
    "  idcmd client <add|update> <layout|right-rail|search-page|runtime|all> [--dry-run] [--yes]",
    "",
    "Flags:",
    "  --dry-run          Preview changes without writing files",
    "  --yes              Skip overwrite prompts for update mode",
    "",
    "Side effects:",
    "  - add: creates missing files only",
    "  - update: overwrites selected files (requires --yes unless --dry-run)",
    "",
    "Examples:",
    "  idcmd client add all",
    "  idcmd client update runtime --dry-run",
    "  idcmd client update layout --yes",
    "",
  ].join("\n");

const HELP_BUILDERS: Record<CommandName, () => string> = {
  build: buildHelp,
  client: clientHelp,
  deploy: deployHelp,
  dev: devHelp,
  init: initHelp,
  preview: previewHelp,
};

const commandHelp = (command: CommandName): string => HELP_BUILDERS[command]();

const asStringFlag = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const asBooleanFlag = (value: unknown): boolean =>
  value === true || value === "true";

const asOptionalBooleanFlag = (value: unknown): boolean | undefined => {
  if (value === false || value === "false") {
    return false;
  }
  return asBooleanFlag(value) ? true : undefined;
};

const handleInit = (parsed: ParsedArgs): Promise<number> => {
  const [dir] = parsed.positionals;
  return initCommand(dir, {
    "base-url": asStringFlag(parsed.flags["base-url"]),
    description: asStringFlag(parsed.flags.description),
    fly: asBooleanFlag(parsed.flags.fly),
    git: asOptionalBooleanFlag(parsed.flags.git),
    name: asStringFlag(parsed.flags.name),
    port: asStringFlag(parsed.flags.port),
    railway: asBooleanFlag(parsed.flags.railway),
    vercel: asBooleanFlag(parsed.flags.vercel),
    yes: asBooleanFlag(parsed.flags.yes),
  });
};

const handleDev = (parsed: ParsedArgs): Promise<number> =>
  devCommand({ port: asStringFlag(parsed.flags.port) });

const handleBuild = (): Promise<number> => buildCommand();

const handlePreview = (parsed: ParsedArgs): Promise<number> => {
  const port = parsePort(parsed.flags.port, DEFAULT_PREVIEW_PORT);
  return previewCommand(port);
};

const handleDeploy = (parsed: ParsedArgs): Promise<number> =>
  deployCommand({
    fly: asBooleanFlag(parsed.flags.fly),
    railway: asBooleanFlag(parsed.flags.railway),
    vercel: asBooleanFlag(parsed.flags.vercel),
  });

const handleClient = (parsed: ParsedArgs): Promise<number> =>
  clientCommand(parsed.positionals, {
    dryRun: asBooleanFlag(parsed.flags["dry-run"]),
    yes: asBooleanFlag(parsed.flags.yes),
  });

const handlers: Record<string, (parsed: ParsedArgs) => Promise<number>> = {
  build: () => handleBuild(),
  client: (parsed) => handleClient(parsed),
  deploy: (parsed) => handleDeploy(parsed),
  dev: (parsed) => handleDev(parsed),
  init: (parsed) => handleInit(parsed),
  preview: (parsed) => handlePreview(parsed),
};

const isHelpCommand = (cmd: string | null): boolean =>
  !cmd || cmd === "--help" || cmd === "-h";

const isVersionCommand = (cmd: string): boolean =>
  cmd === "--version" || cmd === "-v";

const hasSubcommandHelpFlag = (parsed: ParsedArgs): boolean =>
  parsed.flags.help === true ||
  parsed.positionals.includes("--help") ||
  parsed.positionals.includes("-h");

const maybeHandleGeneralHelp = (cmd: string | null): number | null => {
  if (!isHelpCommand(cmd)) {
    return null;
  }
  console.log(globalHelp());
  return 0;
};

const maybeHandleVersion = async (
  cmd: string | null
): Promise<number | null> => {
  if (!cmd || !isVersionCommand(cmd)) {
    return null;
  }
  console.log(await readPackageVersion());
  return 0;
};

const maybeHandleHelpCommand = (parsed: ParsedArgs): number | null => {
  if (parsed.command !== "help") {
    return null;
  }
  const [topic] = parsed.positionals;
  if (topic && isCommandName(topic)) {
    console.log(commandHelp(topic));
    return 0;
  }
  console.log(globalHelp());
  return 0;
};

const maybeHandleSubcommandHelp = (parsed: ParsedArgs): number | null => {
  if (!parsed.command || !isCommandName(parsed.command)) {
    return null;
  }
  if (!hasSubcommandHelpFlag(parsed)) {
    return null;
  }
  console.log(commandHelp(parsed.command));
  return 0;
};

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

  const metaCode = await maybeHandleMetaCommand(parsed);
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
  parsed: ParsedArgs
): Promise<number | null> => {
  const cmd = parsed.command;

  return (
    maybeHandleGeneralHelp(cmd) ??
    (await maybeHandleVersion(cmd)) ??
    maybeHandleHelpCommand(parsed) ??
    maybeHandleSubcommandHelp(parsed)
  );
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
  console.log(globalHelp());
  return 1;
};
