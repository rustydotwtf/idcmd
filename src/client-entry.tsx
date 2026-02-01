import { createRoot } from "react-dom/client";
import { App } from "./App";

// Get the server-rendered content to pass to App
const contentElement = document.getElementById("content");
const contentHtml = contentElement?.innerHTML ?? "";

// Remove the static content container since React will take over
contentElement?.remove();

createRoot(document.getElementById("root")!).render(
  <App contentHtml={contentHtml} />
);
