import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Suppress ResizeObserver loop error (benign in React)
const resizeObserverErr = window.onerror;
window.onerror = (message, ...args) => {
  if (message && message.includes?.('ResizeObserver loop')) {
    return true;
  }
  return resizeObserverErr?.(message, ...args);
};

// Also catch unhandled promise rejections for ResizeObserver
window.addEventListener('error', (e) => {
  if (e.message?.includes?.('ResizeObserver loop')) {
    e.stopPropagation();
    e.preventDefault();
  }
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
