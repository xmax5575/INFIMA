import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.jsx";
import "../src/styles/index.css";

// Get this from your Google Cloud Console
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID";

createRoot(document.getElementById("root")).render(
  <StrictMode>
      <App />
  </StrictMode>
);
