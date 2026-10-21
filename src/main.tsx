import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/Resilience";
import { CartProvider } from "./context/CartContext";
import "lenis/dist/lenis.css";
import "./styles.css";
import "./market.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <CartProvider>
        <App />
      </CartProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
