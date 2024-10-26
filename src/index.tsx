/* @refresh reload */
import "./index.css";
import { Router, Route } from "@solidjs/router";
import { render } from "solid-js/web";
import { lazy } from "solid-js";

const root = document.getElementById("root");

const routes = [
  {
    path: "/",
    component: lazy(() => import("./pages/root")),
  },
  {
    path: "/start",
    component: lazy(() => import("./pages/main")),
  },
  {
    path: "/:code", // Dynamic route to capture the code parameter
    component: lazy(() => import("./pages/room")),
  },
];

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?"
  );
}

render(() => <Router>{routes}</Router>, root!);
