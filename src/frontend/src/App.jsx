import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Role from "./pages/Role";
import ProtectedRoute from "./components/ProtectedRoute";
import { googleLogout } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN } from "./constants";
import Instructor from "./pages/Instructor";
import Student from "./pages/Student";
import Profile from "./pages/Profile";
function Logout() {
  localStorage.clear();
  googleLogout();
  return <Navigate to="/login" />;
}
function RegisterAndLogout() {
  localStorage.clear();
  return <Register />;
}
function isAuthenticated() {
  const token = localStorage.getItem(ACCESS_TOKEN);
  if (!token) return false;
  try {
    const { exp } = jwtDecode(token); // exp je u sekundama
    return exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
function GuestRoute({ children }) {
  return isAuthenticated() ? <Navigate to="/home" replace /> : children;
}

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route path="/register" element={<RegisterAndLogout />} />
          <Route path="/logout" element={<Logout />} />
          
          <Route
            path="/role"
            element={
                  <Role />
            }
          />
          <Route
            path="/home/instructor"
            element={
              <ProtectedRoute allowedRoles={["INSTRUCTOR"]}>
                <Instructor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/home/student"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <Student />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profiles/instructor/edit"
            element = {
              <ProtectedRoute allowedRoles={["INSTRUCTOR"]}>
                  <Profile role = "instructor"/>
              </ProtectedRoute>
            }/>
            <Route
            path="/profiles/student/edit"
            element = {
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                  <Profile role = "student"/>
              </ProtectedRoute>
            }/>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
