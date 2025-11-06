import Header from "../components/Header";
function Instructor() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3674B5] to-[#A1E3F9] font-[Outfit] flex flex-col">
      <Header />
      <button
      className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-[#D1F8EF] text-[#3674B5] text-2xl font-bold
             shadow hover:shadow-md transition
             flex items-center justify-center
             border border-gray-200
             focus:outline-none focus:ring-2 focus:ring-[#3674B5]/40">
        +
      </button>
      
    </div>
  );
}
export default Instructor
