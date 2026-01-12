import api from "../api";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../constants";
import { useGoogleLogin } from "@react-oauth/google";
import GoogleLogo from "../images/logo.jpg";
import { useNavigate } from "react-router-dom";

// Button koji služi za login/registraciju Googleom
function GoogleButton({ method }) {
  const navigate = useNavigate();
  const googleAuthCodeLogin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async (codeResponse) => {
      try {
        // Šaljemo codeResponse backendu da nam on vrati tokene
        const res = await api.post("/api/auth/google/code/", {
          code: codeResponse.code,
        });

        // Uspješan odgovor s backenda - spremamo JWT tokene u localStorage.
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh);

        // Provjera uloge korisnika i navigate na potrebnu stranicu ovisno o ulozi.
        const roleResponse = await api.get("/api/user/role/", {
          headers: { Authorization: `Bearer ${res.data.access}` },
          withCredentials: true,
        });
        const role = roleResponse.data.role;
        if (role) {
          navigate(`/home/${role.toLowerCase()}`);
        } else {
          navigate("/role");
        }
      } catch (err) {}
    },
  });
  return (
    <button
      onClick={() => googleAuthCodeLogin()} // Pozivamo funkciju googleAuthCodeLogin().
      className="w-full flex items-center justify-center gap-3 rounded-lg bg-white/90 hover:bg-white py-3 font-semibold text-[#3674B5] shadow"
    >
      <img src={GoogleLogo} alt="" className="w-4 h-4" />
      <span>{method == "register" ? "Registracija" : "Prijava"} Googleom</span>
    </button>
  );
}
export default GoogleButton;
