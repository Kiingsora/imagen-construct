import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Mvp1App } from "./app/Mvp1App";

const container = document.getElementById("root");
if (!container) throw new Error("Root element was not found.");

createRoot(container).render(
  <StrictMode>
    <Mvp1App />
  </StrictMode>,
);
