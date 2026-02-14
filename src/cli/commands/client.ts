import { ensureDir } from "../fs";
import { dirname, joinPath } from "../path";

const TEMPLATE_UI_DIR = joinPath(
  import.meta.dir,
  "..",
  "..",
  "..",
  "templates",
  "default",
  "site",
  "code",
  "ui"
);
const TEMPLATE_RUNTIME_DIR = joinPath(
  import.meta.dir,
  "..",
  "..",
  "..",
  "templates",
  "default",
  "site",
  "code",
  "runtime"
);

const SITE_UI_DIR = joinPath("site", "code", "ui");
const SITE_RUNTIME_DIR = joinPath("site", "code", "runtime");
const SITE_CONFIG_PATH = joinPath("site", "site.jsonc");

const CLIENT_PARTS = [
  "layout",
  "right-rail",
  "search-page",
  "runtime",
] as const;
type ClientPart = (typeof CLIENT_PARTS)[number];
type ClientAction = "add" | "update";

const RUNTIME_FILES = [
  "live-reload.ts",
  "llm-menu.ts",
  "nav-prefetch.ts",
  "right-rail-scrollspy.ts",
] as const;

interface ClientFileSpec {
  fileName: string;
  targetPath: string;
  templatePath: string;
}

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

const getFileSpecsForPart = (part: ClientPart): ClientFileSpec[] => {
  if (part === "layout") {
    return [
      {
        fileName: "layout.tsx",
        targetPath: joinPath(SITE_UI_DIR, "layout.tsx"),
        templatePath: joinPath(TEMPLATE_UI_DIR, "layout.tsx"),
      },
    ];
  }

  if (part === "right-rail") {
    return [
      {
        fileName: "right-rail.tsx",
        targetPath: joinPath(SITE_UI_DIR, "right-rail.tsx"),
        templatePath: joinPath(TEMPLATE_UI_DIR, "right-rail.tsx"),
      },
    ];
  }

  if (part === "search-page") {
    return [
      {
        fileName: "search-page.tsx",
        targetPath: joinPath(SITE_UI_DIR, "search-page.tsx"),
        templatePath: joinPath(TEMPLATE_UI_DIR, "search-page.tsx"),
      },
    ];
  }

  return RUNTIME_FILES.map((fileName) => ({
    fileName,
    targetPath: joinPath(SITE_RUNTIME_DIR, fileName),
    templatePath: joinPath(TEMPLATE_RUNTIME_DIR, fileName),
  }));
};

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
      "Usage: idcmd client <add|update> <layout|right-rail|search-page|runtime|all> [--dry-run] [--yes]"
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

const readTemplateFile = async (spec: ClientFileSpec): Promise<string> => {
  const file = Bun.file(spec.templatePath);
  if (!(await file.exists())) {
    throw new Error(`Missing template file: ${spec.templatePath}`);
  }
  return file.text();
};

const classifyAddPlan = async (
  part: ClientPart,
  spec: ClientFileSpec,
  nextText: string
): Promise<FilePlan> => {
  const exists = await Bun.file(spec.targetPath).exists();

  return {
    fileName: spec.fileName,
    nextText,
    part,
    reason: exists ? "exists" : "missing",
    shouldWrite: !exists,
    targetPath: spec.targetPath,
  };
};

const classifyUpdatePlan = async (
  part: ClientPart,
  spec: ClientFileSpec,
  nextText: string
): Promise<FilePlan> => {
  const file = Bun.file(spec.targetPath);

  if (!(await file.exists())) {
    return {
      fileName: spec.fileName,
      nextText,
      part,
      reason: "missing",
      shouldWrite: false,
      targetPath: spec.targetPath,
    };
  }

  const currentText = await file.text();
  const isUpToDate = currentText === nextText;

  return {
    fileName: spec.fileName,
    nextText,
    part,
    reason: isUpToDate ? "up-to-date" : "changed",
    shouldWrite: !isUpToDate,
    targetPath: spec.targetPath,
  };
};

const buildPlan = async (args: ParsedClientArgs): Promise<FilePlan[]> => {
  const entries: FilePlan[] = [];
  for (const part of args.parts) {
    const files = getFileSpecsForPart(part);
    for (const file of files) {
      // eslint-disable-next-line no-await-in-loop
      const nextText = await readTemplateFile(file);
      // eslint-disable-next-line no-await-in-loop
      const item =
        args.action === "add"
          ? await classifyAddPlan(part, file, nextText)
          : await classifyUpdatePlan(part, file, nextText);
      entries.push(item);
    }
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
