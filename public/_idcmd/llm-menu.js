const COPY_SELECTOR = 'a[data-copy-markdown="1"]';
const LABEL_SELECTOR = '[data-copy-markdown-label="1"]';
const RESET_DELAY_MS = 2000;

const setLinkDisabled = (link, disabled) => {
  if (disabled) {
    link.setAttribute("aria-disabled", "true");
    link.style.pointerEvents = "none";
    link.style.opacity = "0.8";
    return;
  }

  link.removeAttribute("aria-disabled");
  link.style.pointerEvents = "";
  link.style.opacity = "";
};

const setLinkLabel = (link, next) => {
  const label = link.querySelector(LABEL_SELECTOR);
  if (label) {
    label.textContent = next;
  }
};

const toAbsoluteUrl = (href) => {
  try {
    return new URL(href, window.location.href).toString();
  } catch {
    return href;
  }
};

const createHiddenTextarea = (text) => {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  return textarea;
};

const safeExecCommandCopy = () => {
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  }
};

const copyViaExecCommand = (text) => {
  const textarea = createHiddenTextarea(text);
  document.body.append(textarea);
  textarea.focus();
  textarea.select();
  const ok = safeExecCommandCopy();
  textarea.remove();
  return ok;
};

const copyText = async (text) => {
  const { clipboard } = navigator;
  if (clipboard?.writeText) {
    try {
      await clipboard.writeText(text);
      return true;
    } catch {
      // Fall back below.
    }
  }

  return copyViaExecCommand(text);
};

const closeMenuIfPresent = (link) => {
  const details = link.closest("details");
  if (details instanceof HTMLDetailsElement) {
    details.open = false;
  }
};

const getOriginalLabel = (link) =>
  link.querySelector(LABEL_SELECTOR)?.textContent ??
  "Copy Markdown to Clipboard";

const fetchMarkdownText = async (href) => {
  const res = await fetch(toAbsoluteUrl(href), { credentials: "same-origin" });
  if (!res.ok) {
    return null;
  }
  return res.text();
};

const copyMarkdownFromHref = async (href) => {
  try {
    const text = await fetchMarkdownText(href);
    if (!text) {
      return false;
    }
    return copyText(text);
  } catch {
    return false;
  }
};

const startCopyOperation = (link) => {
  setLinkDisabled(link, true);
  setLinkLabel(link, "Copying...");
};

const finishCopyOperation = (link, ok) => {
  setLinkLabel(link, ok ? "Copied" : "Copy failed");
  closeMenuIfPresent(link);
};

const scheduleResetOperation = (link, originalLabel) => {
  window.setTimeout(() => {
    setLinkLabel(link, originalLabel);
    setLinkDisabled(link, false);
  }, RESET_DELAY_MS);
};

const handleCopyClick = async (link, originalLabel) => {
  const href = link.getAttribute("href");
  if (!href) {
    return;
  }

  startCopyOperation(link);
  const ok = await copyMarkdownFromHref(href);
  finishCopyOperation(link, ok);
  scheduleResetOperation(link, originalLabel);
};

const attachCopyHandler = (link) => {
  const originalLabel = getOriginalLabel(link);
  link.addEventListener("click", async (event) => {
    event.preventDefault();
    if (link.getAttribute("aria-disabled") === "true") {
      return;
    }
    await handleCopyClick(link, originalLabel);
  });
};

const initCopyMarkdownButtons = () => {
  const links = [...document.querySelectorAll(COPY_SELECTOR)];
  for (const link of links) {
    attachCopyHandler(link);
  }
};

initCopyMarkdownButtons();
