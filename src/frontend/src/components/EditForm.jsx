import { useState, useEffect } from "react";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";
import defaultAvatar from "../images/avatar.jpg";
function EditForm({ role }) {
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [subjectsError, setSubjectsError] = useState("");

  const SUBJECT_OPTIONS = ["Matematika", "Fizika", "Informatika"];

  const onSubmit = (e) => {
    e.preventDefault();
    if (subjects.length === 0) {
      setSubjectsError("Odaberi barem jedno područje.");
      return;
    }
    setSubjectsError("");
    console.log({ bio, price, location, subjects });
  };
  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) return;

    api
      .get("/api/user/profile/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const r = res.data;

        // prilagodi poljima koja ti backend vraća:
        const name =
          r.full_name ?? `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim();

        setFullName(name);
      })
      .catch(() => {});
  }, []);

  if (role !== "instructor") return <form />;

  return (
    <div className="w-full">
      <div className="relative mx-auto w-full max-w-5xl rounded-3xl bg-[#D1F8EF] p-10 sm:p-7">
        <form onSubmit={onSubmit}>
          {/* TOP */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* avatar */}
            <div className="lg:col-span-3">
              <div className="lg:col-span-3">
                <div className="h-[180px] w-full max-w-[220px] overflow-hidden rounded-2xl bg-white/40 sm:h-[240px]">
                  <img
                    src={defaultAvatar}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="lg:col-span-9">
              <h1 className="text-[#215993] text-3xl sm:text-5xl font-semibold leading-tight">
                {fullName}
              </h1>

              <div className="mt-3 text-[#3674B5] text-base sm:text-lg leading-snug">
                <span className="font-bold">Biografija: </span>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Upiši biografiju..."
                  rows={4}
                  required
                  className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-[#3674B5]
                             font-normal outline-none focus:bg-white resize-none"
                />
              </div>

              <div className="mt-2 text-[#3674B5]/90 text-base sm:text-lg">
                <span className="font-bold">Lokacija: </span>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="npr. Zagreb"
                  required
                  className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-[#3674B5]
                             font-normal outline-none focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* MAIN */}
          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* LEFT */}
            <div className="lg:col-span-5">
              {/* Područja + cijena */}
              <div className="relative rounded-2xl bg-[#215993] p-5 text-[#D1F8EF]">
                {/* price badge */}
                <div className="absolute right-4 top-4 rounded-full bg-[#3674B5] px-4 py-2 text-lg font-semibold">
                  <div className="flex items-center gap-2">
                    <input
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      inputMode="numeric"
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="10"
                      required
                      className="w-20 rounded-xl bg-white/15 px-3 py-1 text-[#D1F8EF]
                                 outline-none placeholder:text-white/60"
                    />
                    <span>€ / sat</span>
                  </div>
                </div>

                <h2 className="text-lg sm:text-xl font-semibold">Područja</h2>

                <div className="mt-4 flex flex-wrap gap-2 pr-[88px]">
                  {SUBJECT_OPTIONS.map((s) => {
                    const active = subjects.includes(s);

                    return (
                      <button
                        type="button"
                        key={s}
                        onClick={() =>
                          setSubjects((prev) =>
                            prev.includes(s)
                              ? prev.filter((x) => x !== s)
                              : [...prev, s]
                          )
                        }
                        className={
                          "rounded-full px-3 py-1 text-sm sm:text-base transition " +
                          (active
                            ? "border border-white/40 bg-white/20 ring-1 ring-[#D1F8EF] shadow-lg shadow-[#D1F8EF]/20"
                            : "border border-white/25 bg-white/10 hover:bg-white/15")
                        }
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
                {subjectsError && (
                  <p className="mt-2 text-sm text-red-200">{subjectsError}</p>
                )}
              </div>

              {/* Recenzije box (UI placeholder) */}
              <div className="mt-5 rounded-2xl bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-[#3674B5] text-[#D1F8EF] font-bold">
                    ★
                  </div>
                  <div className="text-[#3674B5] text-lg sm:text-xl font-semibold">
                    Recenzije
                  </div>
                </div>

                <p className="mt-3 text-[#3674B5]/60 text-sm sm:text-base">
                  (Kasnije će ovdje biti popis korisničkih recenzija)
                </p>
              </div>
            </div>

            {/* RIGHT */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl bg-[#3674B5] p-5 sm:p-6 text-[#D1F8EF]">
                <div className="text-lg sm:text-xl font-semibold text-center">
                  Spremi promjene
                </div>

                <div className="mt-4 rounded-xl bg-white/10 p-4">
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-[#D1F8EF] px-4 py-2.5 text-[#3674B5]
                               font-semibold hover:brightness-95"
                  >
                    Spremi promjene
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditForm;
