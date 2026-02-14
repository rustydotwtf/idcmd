import type { ResolvedCachePolicy } from "../site/cache";
import type { DeployProvider } from "./provider";

import { ensureDir } from "./fs";
import { dirname, joinPath } from "./path";

interface ProviderFileOptions {
  cachePolicy: ResolvedCachePolicy;
  packageName: string;
  targetDir: string;
}

const DOCKERFILE_PATH = "Dockerfile";
const DOCKERIGNORE_PATH = ".dockerignore";
const FLY_CONFIG_PATH = "fly.toml";
const RAILWAY_CONFIG_PATH = "railway.json";
const VERCEL_CONFIG_PATH = "vercel.json";

const DOCKERFILE = `FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["bun", "src/server.ts"]
`;

const DOCKERIGNORE = `.git
.github
.gitignore
node_modules
public
.env
.env.*
`;

const sanitizeFlyAppName = (value: string): string => {
  const normalized = value
    .toLowerCase()
    .replaceAll(/[^a-z0-9-]/g, "-")
    .replaceAll(/-+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
  if (normalized.length === 0) {
    return "idcmd-app";
  }
  return normalized.slice(0, 63);
};

const buildCacheControl = (args: {
  browserCacheControl: string;
  edgeCacheControl: string | null;
}): string =>
  args.edgeCacheControl
    ? `${args.browserCacheControl}, ${args.edgeCacheControl}`
    : args.browserCacheControl;

const createVercelHeaders = (
  cachePolicy: ResolvedCachePolicy
): {
  headers: { key: string; value: string }[];
  source: string;
}[] => {
  const htmlHeaders = [
    {
      key: "Cache-Control",
      value: buildCacheControl({
        browserCacheControl: cachePolicy.html.browserCacheControl,
        edgeCacheControl: null,
      }),
    },
  ];
  if (cachePolicy.html.edgeCacheControl) {
    htmlHeaders.push({
      key: "Vercel-CDN-Cache-Control",
      value: cachePolicy.html.edgeCacheControl,
    });
  }

  return [
    { headers: htmlHeaders, source: "/(.*)" },
    {
      headers: [
        { key: "Cache-Control", value: cachePolicy.static.cacheControl },
      ],
      source: "/(.*\\..*)",
    },
  ];
};

const createVercelConfig = (cachePolicy: ResolvedCachePolicy): string =>
  `${JSON.stringify(
    {
      $schema: "https://openapi.vercel.sh/vercel.json",
      buildCommand: "bun run build",
      bunVersion: "1.x",
      headers: createVercelHeaders(cachePolicy),
      installCommand: "bun install",
      outputDirectory: "public",
    },
    null,
    2
  )}\n`;

const createFlyToml = (packageName: string): string =>
  `app = "${sanitizeFlyAppName(packageName)}"
primary_region = "iad"

[env]
  NODE_ENV = "production"
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

  [[http_service.checks]]
    grace_period = "10s"
    interval = "30s"
    method = "GET"
    timeout = "5s"
    path = "/health"
`;

const createRailwayConfig = (): string =>
  `${JSON.stringify(
    {
      $schema: "https://railway.com/railway.schema.json",
      build: {
        builder: "DOCKERFILE",
      },
      deploy: {
        healthcheckPath: "/health",
        healthcheckTimeout: 120,
        restartPolicyMaxRetries: 10,
        restartPolicyType: "ON_FAILURE",
        startCommand: "bun src/server.ts",
      },
    },
    null,
    2
  )}\n`;

const writeFile = async (
  targetDir: string,
  relativePath: string,
  text: string
): Promise<void> => {
  const path = joinPath(targetDir, relativePath);
  await ensureDir(dirname(path));
  await Bun.write(path, text);
};

const writeVercelFiles = async (
  args: ProviderFileOptions
): Promise<string[]> => {
  await writeFile(
    args.targetDir,
    VERCEL_CONFIG_PATH,
    createVercelConfig(args.cachePolicy)
  );
  return [VERCEL_CONFIG_PATH];
};

const writeFlyFiles = async (args: ProviderFileOptions): Promise<string[]> => {
  await writeFile(args.targetDir, DOCKERFILE_PATH, DOCKERFILE);
  await writeFile(args.targetDir, DOCKERIGNORE_PATH, DOCKERIGNORE);
  await writeFile(
    args.targetDir,
    FLY_CONFIG_PATH,
    createFlyToml(args.packageName)
  );
  return [DOCKERFILE_PATH, DOCKERIGNORE_PATH, FLY_CONFIG_PATH];
};

const writeRailwayFiles = async (
  args: ProviderFileOptions
): Promise<string[]> => {
  await writeFile(args.targetDir, DOCKERFILE_PATH, DOCKERFILE);
  await writeFile(args.targetDir, DOCKERIGNORE_PATH, DOCKERIGNORE);
  await writeFile(args.targetDir, RAILWAY_CONFIG_PATH, createRailwayConfig());
  return [DOCKERFILE_PATH, DOCKERIGNORE_PATH, RAILWAY_CONFIG_PATH];
};

export const generateProviderFiles = (args: {
  cachePolicy: ResolvedCachePolicy;
  packageName: string;
  provider: DeployProvider;
  targetDir: string;
}): Promise<string[]> => {
  const options = {
    cachePolicy: args.cachePolicy,
    packageName: args.packageName,
    targetDir: args.targetDir,
  };

  if (args.provider === "vercel") {
    return writeVercelFiles(options);
  }
  if (args.provider === "fly") {
    return writeFlyFiles(options);
  }
  return writeRailwayFiles(options);
};

export const providerConfigPaths = {
  dockerfile: DOCKERFILE_PATH,
  dockerignore: DOCKERIGNORE_PATH,
  flyToml: FLY_CONFIG_PATH,
  railwayJson: RAILWAY_CONFIG_PATH,
  vercelJson: VERCEL_CONFIG_PATH,
} as const;
