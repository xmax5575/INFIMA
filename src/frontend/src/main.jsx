import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "../src/styles/index.css";
import { GoogleOAuthProvider } from "@react-oauth/google";

const CLIENT_ID =
  "20019559383-snklmk9maibf47vedifhcra5a32tirvf.apps.googleusercontent.com";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);
