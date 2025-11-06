import React, { useState, useEffect, use } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import api from "../api";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../constants";
import { useGoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import GoogleLogo from "../images/logo.jpg"
import { useNavigate } from "react-router-dom"; 

function GoogleButton({method}){
    const navigate = useNavigate(); 
    const googleAuthCodeLogin = useGoogleLogin({
    flow: "auth-code", // Essential for the backend flow
    onSuccess: async (codeResponse) => {
      try {
        // codeResponse.code contains the authorization code
        const res = await api.post("/api/auth/google/code/", {
          code: codeResponse.code,
        });

        // 2. Handle Django's successful response (your JWT tokens)
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
        alert("Google prijava uspješna!");
        navigate("/home");
      } catch (err) {
        console.error(err);
        alert("Greška prilikom Google prijave/registracije: ", err);
      }
    },
    onError: () => console.log("LOGIN FAILED"),
  });
    return(
        <button
        onClick={() => googleAuthCodeLogin()} // <-- The hook function call
        className="w-full flex items-center justify-center gap-3 rounded-lg bg-white/90 hover:bg-white py-3 font-semibold text-[#3674B5] shadow"
      >
        <img src={GoogleLogo} alt="" className="w-4 h-4"/>
        <span>{method == "register"? "Registracija": "Prijava"} Googleom</span>
      </button>
       

        
    );

}
export default GoogleButton;