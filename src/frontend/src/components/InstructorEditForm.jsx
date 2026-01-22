import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";
import defaultAvatar from "../images/avatar.jpg";
import GoogleMapEmbed from "./GoogleMapEmbed";
import { supabase } from "../supabaseClient";

//Upload slike instruktora u Supabase Storage pod jedinstvenim imenom i vraća njen javni URL za spremanje u bazu
async function uploadInstructorAvatar(file) {
  const ext = file.name.split(".").pop();                 //ekstenzija filea
  const fileName = `${crypto.randomUUID()}.${ext}`;       //unique id
  const path = `instructors/pictures/${fileName}`;
  const { error } = await supabase.storage.from("media").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("media").getPublicUrl(path);     //generiramo javni url koji spremamo u bazu 
  return data.publicUrl;
}
//Upload odabranog videa instruktora i vraća javni URL videa
async function uploadInstructorVideo(file) {
  const ext = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const path = `instructors/videos/${fileName}`;
  const { error } = await supabase.storage
    .from("media")
    .upload(path, file, { cacheControl: "3600" });
  if (error) throw error;
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

export default function InstructorEditForm() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [subjectsError, setSubjectsError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  const SUBJECT_OPTIONS = ["Matematika", "Fizika", "Informatika"];

  // učitaj podatke o instruktoru i ispiši ih na formu kako bi instruktor mogao uređivati 
  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) return;
    const load = async () => {
      try {
        const profRes = await api.get("/api/user/profile/");
        setFullName(
            `${profRes.data.first_name ?? ""} ${
              profRes.data.last_name ?? ""
            }`.trim(),
        );
        const infRes = await api.get("/api/instructor/inf/");
        const inf = infRes.data;
        console.log(inf);
        //
        if (inf.profile_image_url) setAvatarPreview(inf.profile_image_url);
        if (inf.video_url) setVideoPreview(inf.video_url);
        setBio(inf.bio ?? "");
        setLocation(inf.location ?? "");
        setPrice(inf.price_eur != null ? String(inf.price_eur) : "");
        setSubjects(
          Array.isArray(inf.subjects)
            ? inf.subjects.map((s) => s.name).filter(Boolean)
            : [],
        );
      } catch (err) {}
    };
    load();
  }, []);

  //Na submit uploada nove medije ako postoje, validira da je odabran barem jedan predmet,
  //šalje ažurirane podatke backendu i preusmjerava instruktora na njegov home.
  const onSubmit = async (e) => {
    e.preventDefault();
    let profileImageUrl = null;
    let videoUrl = null;
    if (avatarFile) profileImageUrl = await uploadInstructorAvatar(avatarFile);
    if (videoFile) videoUrl = await uploadInstructorVideo(videoFile);
    if (subjects.length === 0) {
      setSubjectsError("Odaberi barem jedno područje.");
      return;
    }
    try {
      await api.post("/api/instructor/me/", {
        bio,
        location,
        price_eur: price === "" ? null : Number(price),
        subjects,
        ...(profileImageUrl && { profile_image_url: profileImageUrl }),
        ...(videoUrl && { video_url: videoUrl }),
      });
      navigate("/home/instructor");
    } catch (err) {}
  };

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-5xl rounded-3xl bg-[#D1F8EF] p-6 sm:p-10 shadow-sm">
        <form onSubmit={onSubmit} className="space-y-8">
          {/* ime + slika + biografija*/}
          <div className="flex flex-col md:flex-row gap-5">
            {/* ime na mobitelu */}
            <h1 className="md:hidden text-[#215993] text-3xl font-semibold">
              {fullName}
            </h1>
            {/* slika */}
            <div className="w-full md:w-56">
              <label htmlFor="avatarUpload" className="cursor-pointer block">
                <div className="relative h-48 md:h-56 w-full bg-[#A8A8A8] rounded-3xl overflow-hidden border-4 border-white shadow-sm group">
                  <img
                    src={avatarPreview || defaultAvatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <span className="text-white text-sm font-bold uppercase">
                      Promijeni sliku
                    </span>
                  </div>
                </div>
              </label>
              <input
                id="avatarUpload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setAvatarFile(file);
                    setAvatarPreview(URL.createObjectURL(file));
                  }
                }}
              />
            </div>

            {/* ime + bio – desktop */}
            <div className="flex flex-col flex-1 gap-4">
              <h1 className="hidden md:block text-[#215993] text-5xl font-semibold">
                {fullName}
              </h1>

              <div className="text-[#3674B5]">
                <span className="font-bold text-lg">Biografija:</span>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  required
                  placeholder="Unesite nešto o sebi..."
                  className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 outline-none resize-none shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* područja + cijena */}
          <div className="rounded-2xl bg-[#215993] p-5 text-[#D1F8EF] flex flex-col md:flex-row gap-4 md:justify-between">
            <div className="flex-1 ">
              <h2 className="text-xl font-bold">Područja</h2>
              <div className="mt-2 flex flex-wrap gap-2">
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
                            : [...prev, s],
                        )
                      }
                      className={`rounded-full px-3 py-1.5 text-sm font-medium border transition ${
                        active
                          ? "border-white/40 bg-white/20 ring-1 ring-[#D1F8EF]"
                          : "border-white/25 bg-white/10 hover:bg-white/15"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
                
              </div>
              {subjectsError !== "" && (<p className="pt-3">{subjectsError}</p>)}
            </div>

            <div className="flex items-center gap-2 bg-white/10 p-3 rounded-xl border border-white/20 self-start">
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                type="number"
                min={0}
                placeholder="10"
                required
                className="w-14 bg-transparent outline-none text-[#D1F8EF] font-bold text-lg text-center"
              />
              <span className="text-sm font-semibold">€ / sat</span>
            </div>
          </div>

          {/* video + lokacija */}
          <div className="flex flex-col md:flex-row gap-5 md:h-56 md:items-stretch">
            {/* video */}
            <div className="w-full md:w-1/2 h-48 md:h-full bg-white/40 rounded-3xl overflow-hidden border-4 border-white shadow-sm relative">
              {videoPreview ? (
                <video
                  src={videoPreview}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center italic text-[#3674B5]/50 text-sm">
                  Dodaj video prezentaciju
                </div>
              )}

              <label className="absolute bottom-2 right-2 cursor-pointer bg-[#3674B5] p-2 rounded-full text-white shadow-lg hover:bg-[#215993] transition">
                <span className="text-[10px] font-bold uppercase px-2">
                  Upload Video
                </span>
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file && file.size <= 50 * 1024 * 1024) {
                      setVideoFile(file);
                      setVideoPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
            </div>

            {/* lokacija */}
            <div className="w-full md:w-1/2 flex flex-col">
              <span className="font-bold text-[#3674B5] mb-2">Lokacija:</span>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="npr. Zagreb"
                className="mb-3 rounded-2xl px-4 py-3"
                required
              />
              <div className="md:h-56 h-48 rounded-3xl overflow-hidden border-4 border-white shadow-sm">
                {location ? (
                  <GoogleMapEmbed
                    location={location}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center italic text-[#3674B5]/50 text-sm">
                    Unesi lokaciju za prikaz mape
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* gumbi */}
          <div className="space-y-4">
            <button
              type="submit"
              className="w-full rounded-xl bg-[#3674B5] px-4 py-3 text-white font-bold shadow-md hover:brightness-105 transition"
            >
              Spremi promjene
            </button>
            <button
              type="button"
              onClick={() => navigate("/home/instructor")}
              className="w-full rounded-xl bg-[#215993] px-4 py-3 text-white font-semibold hover:brightness-105 transition"
            >
              Odustani
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
