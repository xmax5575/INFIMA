import RecenzijaForm from "../components/RecenzijaForm";

export default function Review() {
  return (
    <main className="min-h-screen bg-[#D1F8EF] pt-10">
      <div className="mx-auto max-w-4xl px-4 pb-10">
        {/* naslov */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#215993]">
            Ostavi recenziju
          </h1>
          <p className="mt-2 text-[#3674B5]">
            Tvoje mišljenje pomaže drugima pri odabiru instruktora
          </p>
        </div>
        {/* forma za recenziju */}
        <div className="rounded-3xl bg-[#3674B5] shadow-xl backdrop-blur p-6 sm:p-10">
          <RecenzijaForm />
        </div>
      </div>
    </main>
  );
}
