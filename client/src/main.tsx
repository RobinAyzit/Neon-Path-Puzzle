import { createRoot } from "react-dom/client";
import App from "./App";
import "@fontsource/exo-2/latin-400.css";
import "@fontsource/exo-2/latin-500.css";
import "@fontsource/exo-2/latin-600.css";
import "@fontsource/exo-2/latin-700.css";
import "@fontsource/orbitron/latin-400.css";
import "@fontsource/orbitron/latin-500.css";
import "@fontsource/orbitron/latin-600.css";
import "@fontsource/orbitron/latin-700.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
