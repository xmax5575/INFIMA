import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import defaultAvatar from "../images/avatar.jpg";
import GoogleMapEmbed from "./GoogleMapEmbed";
import api from "../api";
import { useGoogleLogin } from "@react-oauth/google";

//dobivanje instruktorova imena
function getFullName(user) {
  return (
    user?.full_name ||
    "Instruktor"
  );
}

export default function InstructorCard({
  user,
  onClose,
  canEdit = false,
  editTo = "/edit",
}) {
  console.log(user);
  const fullName = getFullName(user);
  const bio = user?.bio || "Ovdje ide biografija instruktora.";
  const location = user?.location || "—";
  const instructor_id = user?.id || null;

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Podaci za prikaz
  const subjectsRaw = user?.subjects ?? [];
  const subjects = Array.isArray(subjectsRaw)
    ? subjectsRaw.map((s) => (s.name))
    : [];

  const ratingRaw = user?.avg_rating ?? "-";
  const rating = String(ratingRaw).replace(".", ",");
  const priceLabel =(user?.price != null ? `${user.price}€` : "—");
  const avatarUrl = user?.profile_image_url || null;
  const videoUrl = user?.video_url || null;
  const lessons = Array.isArray(user?.calendar) ? user.calendar : [];

  // Google Login Logika
  const connectCalendar = useGoogleLogin({
    //dobivanje autorizacijskog koda, dozvole za upravljanje te prosljeđivanje backendu
    flow: "auth-code",
    scope: "https://www.googleapis.com/auth/calendar.events",
    onSuccess: async (codeResponse) => {
      try {
        await api.post("/api/google/calendar/connect/", {
          code: codeResponse.code,
        });
      } catch (e) {
        console.error("Greška pri spajanju kalendara", e);
      }
    },
  });

  // useEffect za recenzije
  useEffect(() => {
    if (!instructor_id) return;
    const fetchReviews = async () => {
      try {
        setLoadingReviews(true);
        const res = await api.get(`/api/instructor/reviews/${instructor_id}/`);
        setReviews(res.data);
      } catch (e) {
        console.error("Greška pri dohvaćanju recenzija", e);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [instructor_id]);

  // renderStars funkcija
  const renderStars = (rating) => {
    const maxStars = 5;
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: maxStars }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating? "text-[#3674B5] fill-[#3674B5]" : "text-[#3674B5]/30"
            }`}
          />
        ))}
      </div>
    );
  };
  // formatiranje termina iz liste
  const formatSlot = (slot) => {
    const t = (slot.time || "").slice(0, 5);
    const d = slot.date || "";
    const place =
      slot.format === "Online"
        ? "Online"
        : slot.location?.trim()
          ? slot.location
          : "Uživo";
    return `${d} ${t} • ${place}`;
  };

  return (
    <div className="w-full">
      <div className="relative mx-auto w-full max-w-5xl rounded-3xl bg-[#D1F8EF] p-5 sm:p-7 shadow-sm">
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-xl bg-white/70 text-2xl text-[#3674B5] hover:bg-white z-20 transition-colors"
          >
            ✕
          </button>
        )}

        {/* HEADER SEKCIJA */}
        <div className="mt-6">
          <h1 className="text-[#215993] text-3xl sm:text-5xl font-semibold leading-tight">
            {fullName}
          </h1>
          <div className="mt-3 text-[#3674B5] text-base sm:text-lg leading-snug">
            <span className="font-bold">Biografija: </span>
            <span className="font-normal">{bio}</span>
          </div>
          <div className="mt-3 text-[#3674B5] text-base sm:text-lg leading-snug pb-4">
            <span className="font-bold">Lokacija: </span>
            <span className="font-normal">{location}</span>
          </div>

          {/* Slika i Mapa red */}
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <div className="h-[210px] w-full sm:max-w-[220px] overflow-hidden rounded-2xl bg-[#808080] shrink-0">
              <img
                src={avatarUrl || defaultAvatar}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="h-[210px] flex-1 overflow-hidden rounded-2xl shadow-inner">
              <GoogleMapEmbed
                location={user.location}
                className="h-full w-full"
              />
            </div>
          </div>
        </div>

        {/* Dugme za Google (samo za instruktora) */}
        {user?.role === "INSTRUCTOR" &&(<button
          onClick={() => connectCalendar()}
          className="mt-6 w-full rounded-xl bg-white px-4 py-3 text-[#3674B5] font-semibold hover:bg-white/90 shadow-sm transition-all"
        >
          Poveži Google kalendar
        </button>)}

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="relative rounded-2xl bg-[#215993] p-5 text-[#D1F8EF]">
              <div className="absolute right-4 top-4 rounded-full bg-[#3674B5] px-4 py-2 text-lg font-semibold">
                {priceLabel}
              </div>
              <h2 className="text-lg sm:text-xl font-semibold">Područja</h2>
              <div className="mt-4 flex flex-wrap gap-2 pr-[88px]">
                {(subjects.length ? subjects : ["—"]).map((s, i) => (
                  <span key={i} className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-sm">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            {videoUrl && (
              <div className="w-full rounded-2xl overflow-hidden shadow-md border-2 border-white bg-black/5">
                <video
                  src={videoUrl}
                  controls
                  playsInline
                  className="w-full aspect-video object-cover"
                />
              </div>
            )}
            <div className="rounded-2xl bg-white h-[280px] flex flex-col overflow-hidden border border-[#3674B5]/10 shadow-sm">
              <div className="p-5 border-b border-[#3674B5]/10 flex items-center gap-3 bg-white sticky top-0 z-10">
                <div className="text-[#3674B5] text-3xl font-semibold">
                  {rating}
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[#3674B5]">
                  <Star className="h-5 w-5 text-[#D1F8EF] fill-[#D1F8EF]" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {loadingReviews ? (
                  <p className="text-sm text-[#3674B5]/60 italic text-center">
                    Učitavanje...
                  </p>
                ) : reviews.length === 0 ? (
                  <p className="text-sm text-[#3674B5]/60 italic text-center">
                    Nema recenzija
                  </p>
                ) : (
                  reviews.slice(0,5).map((r, i) => (
                    <div key={i} className="p-3 rounded-xl border border-[#3674B5]/10 bg-slate-50/50">
                      <div className="flex justify-between items-center mb-1">
                        {renderStars(r.rating)}
                        <span className="text-xs font-bold text-[#3674B5]">
                          {r.student_first_name || "Korisnik"}
                        </span>
                      </div>
                      <p className="text-sm text-[#3674B5]/80 leading-snug">
                        {r.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="lg:col-span-7 flex flex-col">
            <div className="rounded-2xl bg-[#3674B5] p-5 sm:p-6 text-[#D1F8EF] h-full flex flex-col shadow-md">
              <h2 className="text-lg font-semibold text-center mb-4">
                Kalendar instruktora
              </h2>

              {user?.google_calendar_email ? (
                <div className="w-full h-[450px] rounded-xl overflow-hidden bg-white mb-4 shadow-inner">
                  <iframe
                    title="Google Calendar"
                    src={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(user.google_calendar_email)}&ctz=Europe/Zagreb`}
                    className="w-full h-full border-0"
                    scrolling="no"
                  />
                </div>
              ) : (
                <div className="bg-white/10 p-8 rounded-xl text-center mb-4 text-sm italic border border-white/10 flex-1 flex items-center justify-center">
                  Instruktor još nije povezao Google kalendar.
                </div>
              )}

              <div className="mt-auto">
                <p className="text-xs font-bold uppercase tracking-wider mb-2 opacity-70">
                  Dostupni termini:
                </p>
                <div className="flex flex-wrap gap-2">
                  {lessons.length > 0 ? (
                    lessons.slice(0, 6).map((slot) => (
                      <span
                        key={slot.lesson_id}
                        className="rounded-full bg-white/15 px-3 py-1 text-xs border border-white/10"
                      >
                        {formatSlot(slot)}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs opacity-50 italic">
                      Nema upisanih termina
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="mt-6">
            <Link
              to={editTo}
              className="block w-full text-center rounded-xl bg-[#215993] px-4 py-3 text-[#D1F8EF] font-semibold hover:brightness-110 shadow-sm transition-all"
            >
              Uredi profil
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
