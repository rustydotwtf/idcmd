(() => {
  const selector = 'a[data-prefetch="hover"][href]';
  const prefetched = new Set();

  const prefetch = (href) => {
    if (!href || prefetched.has(href)) {
      return;
    }
    prefetched.add(href);

    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = href;
    document.head.append(link);
  };

  const onOver = (event) => {
    const { target } = event;
    if (!(target instanceof Element)) {
      return;
    }
    const link = target.closest(selector);
    if (!(link instanceof HTMLAnchorElement)) {
      return;
    }
    prefetch(link.href);
  };

  document.addEventListener("mouseover", onOver, { passive: true });
})();
