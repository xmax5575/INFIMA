import React, { useState, useEffect, use } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../constants";
import { useGoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

function Form({ route, method }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordAgain, setShowPasswordAgain] = useState(false);

  const navigate = useNavigate();

  const methodName = method === "login" ? "PRIJAVA" : "REGISTRACIJA";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (method === "register" && password !== passwordAgain) {
      const password2 = e.currentTarget.querySelector(
        'input[name="passwordAgain"]'
      );
      password2.setCustomValidity("Lozinke se ne podudaraju.");
      password2.reportValidity();
      password2.focus();
      return;
    }
    try {
      if (method === "login") {
        const res = await api.post("/api/token/", {
          email,
          password,
        });
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
        alert("Prijava uspješna!");
        const res_role = await api.get("/api/user/role/", {
          headers: { Authorization: `Bearer ${res.data.access}` },
          withCredentials: true,
        });
        if (!res_role.data.role) {
          navigate("/role"); //mora birati role
        } else {
          navigate(`/home/${res_role.data.role.toLowerCase()}`); //ima role- ide na home
        }
      } else {
        const res = await api.post("/api/user/register/", {
          first_name: name,
          last_name: lastname,
          email: email,
          password: password,
        });
        if (res.status === 201) {
          alert("Registracija uspješna! Možete se prijaviti.");
          navigate("/login");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Greška prilikom prijave ili registracije.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 bg-[rgba(209,248,239,0.2)] backdrop-blur-md p-10 rounded-xl shadow-xl w-[420px] mt-8"
    >
      <h1 className="text-[24px] font-bold text-[#D1F8EF] mb-8 tracking-wide text-center">
        {methodName}
      </h1>
      <div>
        <label className="block text-[#D1F8EF] font-semibold mb-1">
          E-mail
        </label>
        <input
          className="w-full h-[50px] bg-[rgba(87,143,202,0.3)] rounded-md px-3 text-[#D1F8EF] placeholder-[#D1F8EF] outline-none focus:ring-2 focus:ring-[#D1F8EF]/40"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Unesite e-mail"
          required
        />
      </div>

      <div>
        <label className="block text-[#D1F8EF] font-semibold mb-1">
          Lozinka
        </label>
        <div className="relative">
          <input
            className="w-full h-[50px] bg-[rgba(87,143,202,0.3)] rounded-md px-3 text-[#D1F8EF] placeholder-[#D1F8EF] outline-none focus:ring-2 focus:ring-[#D1F8EF]/40"
            type={showPassword ? "text" : "password"}
            pattern="(?=.*[A-Z])(?=.*\d).{8,}"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onInvalid={(e) =>
              e.currentTarget.setCustomValidity(
                "Lozinka mora imati minimalno 8 znakova, uključujući broj i veliko slovo."
              )
            }
            onInput={(e) => e.currentTarget.setCustomValidity("")} // makni poruku čim korisnik tipka
            placeholder="Unesite lozinku"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#D1F8EF] hover:text-[#A1E3F9] focus:outline-none"
          >
            {showPassword ? (
              <AiOutlineEye size={22} />
            ) : (
              <AiOutlineEyeInvisible size={22} />
            )}
          </button>
        </div>
      </div>
      {method === "register" && (
        <>
          <div>
            <label className="block text-[#D1F8EF] font-semibold mb-1">
              Potvrdi lozinku
            </label>
            <div className="relative">
              <input
                name="passwordAgain"
                className="w-full h-[50px] bg-[rgba(87,143,202,0.3)] rounded-md px-3 text-[#D1F8EF] placeholder-[#D1F8EF] outline-none focus:ring-2 focus:ring-[#D1F8EF]/40 "
                type={showPasswordAgain ? "text" : "password"}
                value={passwordAgain}
                onChange={(e) => setPasswordAgain(e.target.value)}
                onInput={(e) => e.currentTarget.setCustomValidity("")} // makni poruku kad tipka
                placeholder="Ponovno unesite lozinku"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswordAgain(!showPasswordAgain)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#D1F8EF] hover:text-[#A1E3F9] focus:outline-none"
              >
                {showPasswordAgain ? (
                  <AiOutlineEye size={22} />
                ) : (
                  <AiOutlineEyeInvisible size={22} />
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[#D1F8EF] font-semibold mb-1">
              Ime
            </label>
            <input
              className="w-full h-[50px] bg-[rgba(87,143,202,0.3)] rounded-md px-3 text-[#D1F8EF] placeholder-[#D1F8EF] outline-none focus:ring-2 focus:ring-[#D1F8EF]/40"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Unesite ime"
              required
            />
          </div>
          <div>
            <label className="block text-[#D1F8EF] font-semibold mb-1">
              Prezime
            </label>
            <input
              className="w-full h-[50px] bg-[rgba(87,143,202,0.3)] rounded-md px-3 text-[#D1F8EF] placeholder-[#D1F8EF] outline-none focus:ring-2 focus:ring-[#D1F8EF]/40"
              type="text"
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
              placeholder="Unesite prezime"
              required
            />
          </div>
        </>
      )}

      <button
        className="h-[55px] bg-[#578FCA] text-[#D1F8EF] font-extrabold text-lg rounded-lg hover:scale-105 transition-transform duration-200 block w-full"
        type="submit"
      >
        {method === "login" ? "PRIJAVI SE" : "REGISTRIRAJ SE"}
      </button>

      <p className="text-center text-[#578FCA] font-semibold">
        {method === "login" ? "Niste registrirani? " : "Već imate račun? "}
        <a
          href={method === "login" ? "/register" : "/login"}
          className="text-[#3674B5] hover:underline transition-colors"
        >
          {method === "login" ? "Registrirajte se" : "Prijavite se"}
        </a>
      </p>
    </form>
  );
}

export default Form;
