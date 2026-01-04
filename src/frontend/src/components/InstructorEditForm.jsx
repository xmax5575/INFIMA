import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";
import defaultAvatar from "../images/avatar.jpg";

export default function InstructorEditForm() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [subjectsError, setSubjectsError] = useState("");

  const SUBJECT_OPTIONS = ["Matematika", "Fizika", "Informatika"];

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) return;

    const load = async () => {
      try {
        const profRes = await api.get("/api/user/profile/");
        const r = profRes.data;
        const name =
          r.full_name ?? `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim();
        setFullName(name);

        const infRes = await api.get("/api/instructor/inf/");
        const inf = infRes.data;

        setBio(inf.bio ?? "");
        setLocation(inf.location ?? "");
        setPrice(inf.price_eur != null ? String(inf.price_eur) : "");

        const subjectNames = Array.isArray(inf.subjects)
          ? inf.subjects.map((s) => s.name).filter(Boolean)
          : [];
        setSubjects(subjectNames);
      } catch (err) {
        console.error(
          "Greška pri dohvaćanju za edit:",
          err?.response?.data || err
        );
      }
    };

    load();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (subjects.length === 0) {
      setSubjectsError("Odaberi barem jedno područje.");
      return;
    }
    setSubjectsError("");

    try {
      const res = await api.post("/api/instructor/me/", {
        bio,
        location,
        price: price === "" ? null : Number(price),
        subjects,
      });

      console.debug("POST /api/instructor/me/ succeeded:", res?.data);

      // Kada je profil spremljen, postavi zastavicu u localStorage.
      if (
        bio.trim() !== "" &&
        location.trim() !== "" &&
        subjects.length > 0 &&
        Number(price) > 0
      ){
        localStorage.setItem("profile_saved_instructor", "1");
        window.dispatchEvent(
          new CustomEvent("profileUpdated", {
            detail: { role: "instructor", isProfileComplete: true },
          })
        );
      }

      navigate("/home/instructor");
    } catch (err) {
      console.error("Greška pri spremanju:", err?.response?.data || err);
    }
  };

  const handleCancel = () => navigate("/home/instructor");

  return (
    <div className="w-full">
      <div className="relative mx-auto w-full max-w-5xl rounded-3xl bg-[#D1F8EF] p-10 sm:p-7">
        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <div className="h-[180px] w-full max-w-[220px] overflow-hidden rounded-2xl bg-white/40 sm:h-[240px]">
                <img
                  src={defaultAvatar}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

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

          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl bg-[#215993] p-5 text-[#D1F8EF]">
                <div className="absolute right-4 top-4 rounded-full bg-[#3674B5] px-4 py-2 text-lg font-semibold">
                  <div className="flex items-center gap-2">
                    <input
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      inputMode="numeric"
                      type="number"
                      min="1"
                      step="1"
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
            </div>

            <div className="lg:col-span-7">
              <div className="rounded-2xl bg-[#3674B5] p-5 sm:p-6 text-[#D1F8EF]">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#D1F8EF] px-4 py-2.5 text-[#3674B5]
                             font-semibold hover:brightness-95"
                >
                  Spremi promjene
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full mt-4 rounded-xl bg-[#215993] px-4 py-2.5 text-white
                             font-semibold hover:brightness-95"
                >
                  Odustani
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
