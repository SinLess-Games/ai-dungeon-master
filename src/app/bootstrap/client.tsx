import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";

import { router } from "@/app/router/router";
import { AppProviders } from "@/app/bootstrap/providers";

import "@/styles/styles.css";

function getRootElement(): HTMLElement {
  const element = document.getElementById("root");

  if (!element) {
    throw new Error(
      'Endless Codex could not start because the root element "#root" was not found.',
    );
  }

  return element;
}

const root = createRoot(getRootElement());

root.render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);