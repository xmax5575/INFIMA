import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";
import defaultAvatar from "../images/avatar.jpg";
import GoogleMapEmbed from "./GoogleMapEmbed";
import { supabase } from "../supabaseClient";

async function uploadInstructorAvatar(file) {
  const ext = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const path = `instructors/pictures/${fileName}`;
  const { error } = await supabase.storage.from("media").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

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

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) return;
    const load = async () => {
      try {
        const profRes = await api.get("/api/user/profile/");
        setFullName(
          profRes.data.full_name ??
            `${profRes.data.first_name ?? ""} ${
              profRes.data.last_name ?? ""
            }`.trim()
        );
        const infRes = await api.get("/api/instructor/inf/");
        const inf = infRes.data;
        if (inf.profile_image_url) setAvatarPreview(inf.profile_image_url);
        if (inf.video_url) setVideoPreview(inf.video_url);
        setBio(inf.bio ?? "");
        setLocation(inf.location ?? "");
        setPrice(inf.price_eur != null ? String(inf.price_eur) : "");
        setSubjects(
          Array.isArray(inf.subjects)
            ? inf.subjects.map((s) => s.name).filter(Boolean)
            : []
        );
      } catch (err) {}
    };
    load();
  }, []);

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
        <form onSubmit={onSubmit} className="space-y-6">
          {/* 1. IME (GORNJI LIJEVI KUT) */}
          <div className="text-left">
            <h1 className="text-[#215993] text-3xl sm:text-5xl font-semibold leading-tight">
              {fullName}
            </h1>
          </div>

          {/* 2. BIOGRAFIJA (FULL WIDTH) */}
          <div className="w-full text-[#3674B5]">
            <span className="font-bold text-lg">Biografija:</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Upiši biografiju..."
              rows={4}
              required
              className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-[#3674B5] outline-none focus:bg-white resize-none shadow-sm"
            />
          </div>

          {/* 3. REDAK: SLIKA | PODRUČJA | VIDEO */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {/* Slika */}
            <div className="flex flex-col">
              <label htmlFor="avatarUpload" className="cursor-pointer h-full">
                <div className="relative h-56 w-full bg-[#A8A8A8] rounded-3xl overflow-hidden border-4 border-white shadow-sm group">
                  <img
                    src={avatarPreview || defaultAvatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm font-bold uppercase text-center px-2">
                      Promijeni sliku
                    </span>
                  </div>
                </div>
              </label>
              <input
                type="file"
                accept="image/*"
                id="avatarUpload"
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

            {/* Područja i Cijena */}
            <div className="relative rounded-2xl bg-[#215993] p-5 text-[#D1F8EF] flex flex-col shadow-sm h-56">
              <div className="flex-1">
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
                              : [...prev, s]
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
              </div>
              
              {/* Centrirana Cijena */}
              <div className="flex items-center justify-center gap-2 bg-white/10 p-2 rounded-xl border border-white/20 mt-auto">
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  type="number"
                  placeholder="10"
                  required
                  className="w-12 bg-transparent outline-none text-[#D1F8EF] font-bold text-lg text-center"
                />
                <span className="text-sm font-semibold text-[#D1F8EF]">
                  € / sat
                </span>
              </div>
            </div>

            {/* Video */}
            <div className="flex flex-col">
              <div className="h-56 w-full bg-white/40 rounded-3xl overflow-hidden border-4 border-white shadow-sm relative group">
                {videoPreview ? (
                  <video
                    src={videoPreview}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center italic text-[#3674B5]/50 text-sm p-4 text-center">
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
            </div>
          </div>

          {/* 4. MAPA (LIJEVO) I GUMBI (DESNO) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
            {/* Mapa */}
            <div className="md:col-span-8 space-y-2">
              <span className="font-bold text-[#3674B5]">Lokacija:</span>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="npr. Zagreb"
                required
                className="w-full rounded-2xl bg-white/70 px-4 py-3 text-[#3674B5] outline-none focus:bg-white shadow-sm mb-3"
              />
              {location && (
                <div className="h-56 rounded-3xl overflow-hidden border-4 border-white shadow-sm">
                  <GoogleMapEmbed
                    location={location}
                    className="h-full w-full"
                  />
                </div>
              )}
            </div>

            {/* Gumbi za akciju */}
            <div className="md:col-span-4 space-y-4">
              <div className="rounded-3xl bg-[#3674B5] p-5 shadow-sm space-y-3">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#D1F8EF] px-4 py-3 text-[#3674B5] font-bold hover:brightness-105 transition shadow-md"
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
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}