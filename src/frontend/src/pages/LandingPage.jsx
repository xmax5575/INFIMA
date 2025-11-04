import Header from "../components/Header";

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3674B5] to-[#A1E3F9] font-[Outfit] text-[#D1F8EF] flex flex-col">
      <Header />

      <main className="flex flex-1 justify-center items-center flex-col px-4 sm:px-8 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center sm:space-x-16 space-y-8 sm:space-y-0">
          <div className="text-4xl sm:text-5xl lg:text-6xl font-light leading-tight sm:leading-[63px]">
            <p>Informatika</p>
            <p>Fizika</p>
            <p>Matematika</p>
          </div>

          <h1 className="text-[70px] sm:text-[120px] lg:text-[150px] font-medium tracking-[0.1em]">
            INFIMA.
          </h1>
        </div>
      </main>
    </div>
  );
}

export default LandingPage;
