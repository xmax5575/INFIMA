import Header from "../components/Header";
import Form from "../components/Form";

function Register(){
    return (
        <div className="min-h-screen bg-gradient-to-b from-[#3674B5] to-[#A1E3F9] font-[Outfit] flex flex-col">
      <Header />
      <div className="flex flex-1 justify-center items-center mt-20">
        <Form method="register" route="/register" />
        
      </div>
    </div>
    );

}
export default Register;