import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { NotificationProvider } from "./context/Notifications";
import { ErrorBoundary } from "./components/Resilience";
import { CartProvider } from "./context/CartContext";
import "lenis/dist/lenis.css";
import "./styles.css";
import "./market.css";
import "./pickles.css";
import "./pantry.css";
import "./cinematic.css";
import "./experience.css";
import "./commerce.css";
import "./cart.css";
import "./store-redesign.css";
import "./account.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <CartProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </CartProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
