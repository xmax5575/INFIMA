import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Role from "./pages/Role";
import Home from "./pages/Home";
import ProtectedRoute from "./components/ProtectedRoute";
import { googleLogout } from "@react-oauth/google";

function Logout() {
  localStorage.clear();
  googleLogout()
  return <Navigate to="/login" />;
}
function RegisterAndLogout() {
  localStorage.clear();
  return <Register />;
}

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterAndLogout />} />
          <Route path="/logout" element={<Logout />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
