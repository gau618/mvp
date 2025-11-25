import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DocumentProvider } from "./contexts/DocumentContext";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <DocumentProvider>
        <App />
      </DocumentProvider>
    </ThemeProvider>
  </StrictMode>
);
