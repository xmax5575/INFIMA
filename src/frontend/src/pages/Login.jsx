import Header from "../components/Header";
import Form from "../components/Form";
import GoogleButton from "../components/GoogleButton";

// Stranica koja se otvara za rutu /login.
// Za Formu i GoogleButton prosljeđujemo method kako bi nam komponente znale što raditi.
function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3674B5] to-[#A1E3F9] font-[Outfit] flex flex-col">
      <Header />
      <div className="flex flex-1 justify-center items-center mt-20">
        <div className="flex flex-col gap-3">
          <Form method="login"/>
          <div className="flex items-center gap-2">
            <div className="h-px bg-white/40 w-full" />
            <span className="text-white/70 text-sm">ili</span>
            <div className="h-px bg-white/40 w-full" />
          </div>
          <GoogleButton method="login" />
        </div>
      </div>
    </div>
  );
}

export default Login;
