import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// global logout bridge
window.addEventListener('app:logout', () => {
  try { localStorage.removeItem('auth'); } catch {}
  location.href = '/login';
});
