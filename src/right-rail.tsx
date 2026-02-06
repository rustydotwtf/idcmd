import type { JSX } from "preact";

import type { TocItem } from "./utils/toc";

const CaretDownIcon = (): JSX.Element => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M7 10l5 5 5-5"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

const buildSlugFromCurrentPath = (currentPath: string): string => {
  if (currentPath === "/") {
    return "index";
  }

  const trimmed = currentPath.replaceAll(/^\/+|\/+$/g, "");
  return trimmed || "index";
};

const buildAskUrls = ({
  canonicalUrl,
  currentPath,
}: {
  canonicalUrl?: string;
  currentPath: string;
}): { chatgptUrl: string; claudeUrl: string } => {
  const slug = buildSlugFromCurrentPath(currentPath);
  const markdownPath = `/${slug}.md`;
  const markdownUrl = canonicalUrl
    ? new URL(markdownPath, canonicalUrl).toString()
    : markdownPath;

  const prompt = `Investigate this document and explain it to the user: ${markdownUrl}`;

  const chatgpt = new URL("https://chatgpt.com/");
  chatgpt.searchParams.set("prompt", prompt);

  const claude = new URL("https://claude.ai/new");
  claude.searchParams.set("q", prompt);

  return { chatgptUrl: chatgpt.toString(), claudeUrl: claude.toString() };
};

const AskInDropdown = ({
  claudeUrl,
  chatgptUrl,
}: {
  claudeUrl: string;
  chatgptUrl: string;
}): JSX.Element => (
  <details class="llm-menu relative">
    <summary class="flex w-full cursor-pointer select-none items-center justify-between gap-3 rounded-full border border-border bg-card/30 px-4 py-2 text-sm shadow-sm hover:bg-card/40">
      <span class="flex items-center gap-2">
        <img
          src="/openai-white.svg"
          alt=""
          width={18}
          height={18}
          class="shrink-0"
        />
        <span>Ask in ChatGPT</span>
      </span>
      <span class="text-muted-foreground">
        <CaretDownIcon />
      </span>
    </summary>

    <div class="absolute left-0 right-0 z-50 mt-2 rounded-xl border border-border bg-popover p-1 shadow-sm">
      <a
        href={chatgptUrl}
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
      >
        <img
          src="/openai-white.svg"
          alt=""
          width={18}
          height={18}
          class="shrink-0"
        />
        <span>Ask in ChatGPT</span>
      </a>
      <a
        href={claudeUrl}
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
      >
        <img
          src="/anthropic-white.svg"
          alt=""
          width={18}
          height={18}
          class="shrink-0"
        />
        <span>Ask in Claude</span>
      </a>
    </div>
  </details>
);

const OnThisPage = ({ items }: { items: TocItem[] }): JSX.Element => (
  <section class="rounded-xl border border-border bg-card/30 p-4">
    <h2 class="text-sm font-semibold text-foreground">On this page</h2>
    <nav class="mt-3">
      <ul class="space-y-2 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item.id} class={item.level === 3 ? "pl-3" : ""}>
            <a href={`#${item.id}`} class="hover:text-foreground">
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  </section>
);

export const RightRail = ({
  canonicalUrl,
  currentPath,
  tocItems,
}: {
  canonicalUrl?: string;
  currentPath: string;
  tocItems: TocItem[];
}): JSX.Element => {
  const { chatgptUrl, claudeUrl } = buildAskUrls({ canonicalUrl, currentPath });

  return (
    <aside class="hidden xl:block w-64 shrink-0">
      <div class="sticky top-24 space-y-6">
        <AskInDropdown chatgptUrl={chatgptUrl} claudeUrl={claudeUrl} />
        {tocItems.length > 0 ? <OnThisPage items={tocItems} /> : null}
      </div>
    </aside>
  );
};
