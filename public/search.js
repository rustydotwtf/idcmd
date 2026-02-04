const MIN_QUERY_LENGTH = 2;
const SEARCH_ENDPOINT = "/api/search";
const SEARCH_DEBOUNCE_MS = 180;
const MAX_RESULTS = 12;

const isSearchResult = (value) => {
  if (!value || typeof value !== "object") {
    return false;
  }

  return (
    typeof value.slug === "string" &&
    typeof value.title === "string" &&
    typeof value.description === "string"
  );
};

const parseSearchLine = (line) => {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return null;
  }

  return isSearchResult(parsed) ? parsed : null;
};

const parseJsonLines = (jsonl) => {
  const parsedLines = jsonl.split("\n").map((line) => parseSearchLine(line));
  return parsedLines.filter((result) => result !== null);
};

const setStatusText = (statusEl, text) => {
  statusEl.textContent = text;
};

const setResultsVisible = (resultsEl, visible) => {
  resultsEl.classList.toggle("hidden", !visible);
};

const clearResults = (resultsEl) => {
  resultsEl.replaceChildren();
  setResultsVisible(resultsEl, false);
};

const createResultLink = (result) => {
  const link = document.createElement("a");
  link.href = result.slug;
  link.className = "font-medium underline decoration-border underline-offset-4";
  link.textContent = result.title;
  return link;
};

const createResultDescription = (result) => {
  const description = document.createElement("p");
  description.className = "mt-1 text-sm text-muted-foreground";
  description.textContent = result.description;
  return description;
};

const createResultItem = (result) => {
  const listItem = document.createElement("li");
  listItem.className = "rounded-md border border-border p-2";

  listItem.append(createResultLink(result), createResultDescription(result));
  return listItem;
};

const renderResults = (resultsEl, results) => {
  const limitedResults = results.slice(0, MAX_RESULTS);
  const items = limitedResults.map((result) => createResultItem(result));
  resultsEl.replaceChildren(...items);
  setResultsVisible(resultsEl, items.length > 0);
};

const describeResults = (query, results) => {
  if (results.length === 0) {
    return `No matches for "${query}".`;
  }
  return `Found ${results.length} result(s).`;
};

const isAbortError = (error) =>
  error instanceof DOMException && error.name === "AbortError";

const fetchSearchResults = async (query, signal) => {
  const response = await fetch(
    `${SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}`,
    {
      signal,
    }
  );

  if (!response.ok) {
    return null;
  }

  const jsonl = await response.text();
  return parseJsonLines(jsonl);
};

const handleShortQuery = (statusEl, resultsEl) => {
  clearResults(resultsEl);
  setStatusText(
    statusEl,
    `Type at least ${MIN_QUERY_LENGTH} characters to search.`
  );
};

const handleSearchError = (error, statusEl, resultsEl) => {
  if (isAbortError(error)) {
    return;
  }

  clearResults(resultsEl);
  setStatusText(statusEl, "Search failed. Please try again.");
};

const clearActiveRequest = (activeRequest, requestController) =>
  activeRequest === requestController ? undefined : activeRequest;

const abortActiveRequest = (activeRequest) => {
  if (activeRequest) {
    activeRequest.abort();
  }
};

const shouldSkipQuery = (query, statusEl, resultsEl) => {
  if (query.length >= MIN_QUERY_LENGTH) {
    return false;
  }

  handleShortQuery(statusEl, resultsEl);
  return true;
};

const startSearchRequest = (statusEl) => {
  setStatusText(statusEl, "Searching...");
  return new AbortController();
};

const searchAndRender = async (query, statusEl, resultsEl, signal) => {
  const results = await fetchSearchResults(query, signal);
  if (!results) {
    clearResults(resultsEl);
    setStatusText(statusEl, "Search is temporarily unavailable.");
    return;
  }

  renderResults(resultsEl, results);
  setStatusText(statusEl, describeResults(query, results));
};

const runSearchRequest = async (
  query,
  statusEl,
  resultsEl,
  activeRequest,
  requestController
) => {
  try {
    await searchAndRender(query, statusEl, resultsEl, requestController.signal);
  } catch (error) {
    handleSearchError(error, statusEl, resultsEl);
  }

  return clearActiveRequest(activeRequest, requestController);
};

const createSearchHandler = (statusEl, resultsEl) => {
  let activeRequest;

  return async (query) => {
    abortActiveRequest(activeRequest);
    if (shouldSkipQuery(query, statusEl, resultsEl)) {
      activeRequest = undefined;
      return;
    }

    const requestController = startSearchRequest(statusEl);
    activeRequest = requestController;
    activeRequest = await runSearchRequest(
      query,
      statusEl,
      resultsEl,
      activeRequest,
      requestController
    );
  };
};

const scheduleSearch = (runSearch) => {
  let debounceTimer;

  return (query) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      runSearch(query.trim());
    }, SEARCH_DEBOUNCE_MS);
  };
};

const getSearchElements = (rootEl) => {
  const formEl = rootEl.querySelector("[data-search-form]");
  const inputEl = rootEl.querySelector("#site-search");
  const statusEl = rootEl.querySelector("[data-search-status]");
  const resultsEl = rootEl.querySelector("[data-search-results]");

  if (
    !(formEl instanceof HTMLFormElement) ||
    !(inputEl instanceof HTMLInputElement) ||
    !(statusEl instanceof HTMLElement) ||
    !(resultsEl instanceof HTMLElement)
  ) {
    return null;
  }

  return { formEl, inputEl, resultsEl, statusEl };
};

const wireSearchRoot = (rootEl) => {
  const elements = getSearchElements(rootEl);
  if (!elements) {
    return;
  }

  const { formEl, inputEl, statusEl, resultsEl } = elements;
  const runSearch = createSearchHandler(statusEl, resultsEl);
  const queueSearch = scheduleSearch(runSearch);

  formEl.addEventListener("submit", (event) => {
    event.preventDefault();
    queueSearch(inputEl.value);
  });

  inputEl.addEventListener("input", () => {
    queueSearch(inputEl.value);
  });
};

const initSearch = () => {
  const roots = document.querySelectorAll("[data-search-root]");
  for (const root of roots) {
    if (root instanceof HTMLElement) {
      wireSearchRoot(root);
    }
  }
};

initSearch();
