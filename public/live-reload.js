(() => {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const socket = new WebSocket(`${protocol}//${location.host}/__live-reload`);

  socket.addEventListener("message", (event) => {
    if (event.data === "reload") {
      location.reload();
    }
  });

  socket.addEventListener("close", () => {
    setTimeout(() => {
      location.reload();
    }, 1000);
  });
})();
