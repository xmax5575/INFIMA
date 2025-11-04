import Header from "../components/Header";
import Form from "../components/Form";

function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3674B5] to-[#A1E3F9] font-[Outfit] flex flex-col">
      <Header />
      <div className="flex flex-1 justify-center items-center">
        <Form method="login" route="/login" />
      </div>
    </div>
  );
}

export default Login;
