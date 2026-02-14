export type Provider = "none" | "vercel" | "fly" | "railway";
export type DeployProvider = Exclude<Provider, "none">;

export interface ProviderFlags {
  fly?: boolean;
  railway?: boolean;
  vercel?: boolean;
}

const DEPLOY_PROVIDERS: readonly DeployProvider[] = [
  "vercel",
  "fly",
  "railway",
];

const isFlagEnabled = (value: boolean | undefined): boolean => value === true;

const selectedProviders = (flags: ProviderFlags): DeployProvider[] =>
  DEPLOY_PROVIDERS.filter((provider) => isFlagEnabled(flags[provider]));

const formatProviderFlags = (providers: readonly DeployProvider[]): string =>
  providers.map((provider) => `--${provider}`).join(" ");

export const resolveProviderFromFlags = (flags: ProviderFlags): Provider => {
  const selected = selectedProviders(flags);
  if (selected.length > 1) {
    throw new Error(
      `Choose exactly one provider. Received ${formatProviderFlags(selected)}.`
    );
  }
  return selected[0] ?? "none";
};

export const isDeployProvider = (
  provider: Provider
): provider is DeployProvider => provider !== "none";
