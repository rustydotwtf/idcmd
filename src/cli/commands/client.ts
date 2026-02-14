import { ensureDir } from "../fs";
import { dirname, joinPath } from "../path";

const TEMPLATE_CLIENT_DIR = joinPath(
  import.meta.dir,
  "..",
  "..",
  "..",
  "templates",
  "default",
  "site",
  "client"
);

const SITE_CLIENT_DIR = joinPath("site", "client");
const SITE_CONFIG_PATH = joinPath("site", "site.jsonc");

const CLIENT_PARTS = ["layout", "right-rail", "search-page"] as const;
type ClientPart = (typeof CLIENT_PARTS)[number];
type ClientAction = "add" | "update";

const CLIENT_PART_TO_FILE: Record<ClientPart, string> = {
  layout: "layout.tsx",
  "right-rail": "right-rail.tsx",
  "search-page": "search-page.tsx",
};

export interface ClientFlags {
  dryRun?: boolean;
  yes?: boolean;
}

interface ParsedClientArgs {
  action: ClientAction;
  parts: ClientPart[];
}

interface FilePlan {
  fileName: string;
  nextText: string;
  part: ClientPart;
  reason: string;
  shouldWrite: boolean;
  targetPath: string;
}

const isClientAction = (value: string): value is ClientAction =>
  value === "add" || value === "update";

const isClientPart = (value: string): value is ClientPart =>
  CLIENT_PARTS.includes(value as ClientPart);

const parseClientPart = (value: string | undefined): ClientPart[] => {
  if (!value || value === "all") {
    return [...CLIENT_PARTS];
  }

  if (!isClientPart(value)) {
    throw new Error(
      `Unknown client part: ${value}. Expected one of ${CLIENT_PARTS.join(", ")} or all.`
    );
  }

  return [value];
};

const parseClientArgs = (positionals: string[]): ParsedClientArgs => {
  const [actionRaw, partRaw] = positionals;
  if (!actionRaw || !isClientAction(actionRaw)) {
    throw new Error(
      "Usage: idcmd client <add|update> <layout|right-rail|search-page|all> [--dry-run] [--yes]"
    );
  }

  return {
    action: actionRaw,
    parts: parseClientPart(partRaw),
  };
};

const ensureSiteLayout = async (): Promise<void> => {
  if (!(await Bun.file(SITE_CONFIG_PATH).exists())) {
    throw new Error(
      `Could not find ${SITE_CONFIG_PATH}. Run this command from an idcmd site project root.`
    );
  }
};

const readTemplateFile = async (part: ClientPart): Promise<string> => {
  const fileName = CLIENT_PART_TO_FILE[part];
  const path = joinPath(TEMPLATE_CLIENT_DIR, fileName);
  const file = Bun.file(path);
  if (!(await file.exists())) {
    throw new Error(`Missing template file: ${path}`);
  }
  return file.text();
};

const classifyAddPlan = async (
  part: ClientPart,
  nextText: string
): Promise<FilePlan> => {
  const fileName = CLIENT_PART_TO_FILE[part];
  const targetPath = joinPath(SITE_CLIENT_DIR, fileName);
  const exists = await Bun.file(targetPath).exists();

  return {
    fileName,
    nextText,
    part,
    reason: exists ? "exists" : "missing",
    shouldWrite: !exists,
    targetPath,
  };
};

const classifyUpdatePlan = async (
  part: ClientPart,
  nextText: string
): Promise<FilePlan> => {
  const fileName = CLIENT_PART_TO_FILE[part];
  const targetPath = joinPath(SITE_CLIENT_DIR, fileName);
  const file = Bun.file(targetPath);

  if (!(await file.exists())) {
    return {
      fileName,
      nextText,
      part,
      reason: "missing",
      shouldWrite: false,
      targetPath,
    };
  }

  const currentText = await file.text();
  const isUpToDate = currentText === nextText;

  return {
    fileName,
    nextText,
    part,
    reason: isUpToDate ? "up-to-date" : "changed",
    shouldWrite: !isUpToDate,
    targetPath,
  };
};

const buildPlan = async (args: ParsedClientArgs): Promise<FilePlan[]> => {
  const entries: FilePlan[] = [];
  for (const part of args.parts) {
    // eslint-disable-next-line no-await-in-loop
    const nextText = await readTemplateFile(part);
    // eslint-disable-next-line no-await-in-loop
    const item =
      args.action === "add"
        ? await classifyAddPlan(part, nextText)
        : await classifyUpdatePlan(part, nextText);
    entries.push(item);
  }
  return entries;
};

const getWriteLabel = (action: ClientAction): "create" | "update" =>
  action === "add" ? "create" : "update";

const getSkipReason = (action: ClientAction, item: FilePlan): string => {
  if (action === "add") {
    return item.reason;
  }

  return item.reason === "missing"
    ? `missing; run: idcmd client add ${item.part}`
    : item.reason;
};

const formatPlanLine = (action: ClientAction, item: FilePlan): string => {
  if (item.shouldWrite) {
    return `[${getWriteLabel(action)}] ${item.targetPath}`;
  }

  return `[skip] ${item.targetPath} (${getSkipReason(action, item)})`;
};

const printPlan = (action: ClientAction, plan: FilePlan[]): void => {
  for (const item of plan) {
    console.log(formatPlanLine(action, item));
  }
};

const ensureUpdateConfirmed = (
  flags: ClientFlags,
  plan: FilePlan[],
  action: ClientAction
): void => {
  if (action !== "update") {
    return;
  }

  if (flags.dryRun) {
    return;
  }

  const pending = plan.some((item) => item.shouldWrite);
  if (pending && !flags.yes) {
    throw new Error(
      "Refusing to overwrite client files without --yes. Re-run with: idcmd client update <part> --yes"
    );
  }
};

const applyPlan = async (plan: FilePlan[]): Promise<void> => {
  for (const item of plan) {
    if (!item.shouldWrite) {
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    await ensureDir(dirname(item.targetPath));
    // eslint-disable-next-line no-await-in-loop
    await Bun.write(item.targetPath, item.nextText);
  }
};

const printDryRunFooter = (plan: FilePlan[]): void => {
  const count = plan.filter((item) => item.shouldWrite).length;
  console.log(`[dry-run] ${count} file(s) would change.`);
};

const printAppliedFooter = (plan: FilePlan[]): void => {
  const count = plan.filter((item) => item.shouldWrite).length;
  console.log(`Applied ${count} change(s).`);
};

const maybeHandleDryRun = (flags: ClientFlags, plan: FilePlan[]): boolean => {
  if (!flags.dryRun) {
    return false;
  }

  printDryRunFooter(plan);
  return true;
};

const applyPlanWithSummary = async (plan: FilePlan[]): Promise<void> => {
  await applyPlan(plan);
  printAppliedFooter(plan);
};

export const clientCommand = async (
  positionals: string[],
  flags: ClientFlags
): Promise<number> => {
  await ensureSiteLayout();
  const parsed = parseClientArgs(positionals);
  const plan = await buildPlan(parsed);

  printPlan(parsed.action, plan);
  ensureUpdateConfirmed(flags, plan, parsed.action);

  if (maybeHandleDryRun(flags, plan)) {
    return 0;
  }

  await applyPlanWithSummary(plan);
  return 0;
};
