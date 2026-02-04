const toSameOriginDestination = (href) => {
  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin) {
    return null;
  }

  return url.toString();
};

const appendPrefetchLink = (destination) => {
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.as = "document";
  link.href = destination;
  document.head.append(link);
};

const addPrefetchListeners = (link, prefetched) => {
  const prefetch = () => {
    const destination = toSameOriginDestination(link.href);
    if (!destination || prefetched.has(destination)) {
      return;
    }

    prefetched.add(destination);
    appendPrefetchLink(destination);
  };

  link.addEventListener("mouseenter", prefetch, {
    passive: true,
  });
  link.addEventListener("focus", prefetch, {
    passive: true,
  });
  link.addEventListener("touchstart", prefetch, {
    once: true,
    passive: true,
  });
};

const startPrefetchOnHover = () => {
  const { connection } = navigator;
  if (connection?.saveData) {
    return;
  }

  const prefetched = new Set();
  const links = document.querySelectorAll("a[data-prefetch='hover']");

  for (const link of links) {
    if (link instanceof HTMLAnchorElement) {
      addPrefetchListeners(link, prefetched);
    }
  }
};

startPrefetchOnHover();
