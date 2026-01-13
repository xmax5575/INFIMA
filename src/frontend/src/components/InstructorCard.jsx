import React from "react";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import defaultAvatar from "../images/avatar.jpg";
import GoogleMapEmbed from "./GoogleMapEmbed";
import api from "../api";
import { useState, useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";

function getFullName(user) {
  return (
    user?.full_name ||
    `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() ||
    "Instruktor"
  );
}

export default function InstructorCard({
  user,
  onClose,
  canEdit = false,
  editTo = "/edit",
}) {
  const fullName = getFullName(user);

  const bio = user?.bio || "Ovdje ide biografija instruktora.";
  const location = user?.location || "—";
  const instructor_id = user?.id || null;
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // subjects dolaze kao objekti -> pretvori u array stringova (name)
  const subjectsRaw = user?.subjects ?? [];
  const subjects = Array.isArray(subjectsRaw)
    ? subjectsRaw
        .map((s) => (typeof s === "string" ? s : s?.name))
        .filter(Boolean)
    : [];

  const ratingRaw = user?.avg_rating ?? "-";
  const rating = String(ratingRaw).replace(".", ",");

  // cijena kod tebe: price_eur
  const priceLabel =
    user?.price_label ?? (user?.price_eur != null ? `${user.price_eur}€` : "—");

  const avatarUrl = user?.profile_image_url || null;
  const videoUrl = user?.video_url || null;

  // calendar/lessons
  const lessons = Array.isArray(user?.calendar) ? user.calendar : [];

  const connectCalendar = useGoogleLogin({
    flow: "auth-code",
    scope: "https://www.googleapis.com/auth/calendar.events",
    onSuccess: async (codeResponse) => {
      try {
        await api.post("/api/google/calendar/connect/", {
          code: codeResponse.code,
        });
        alert("Google Calendar uspješno povezan!");
      } catch (e) {
        alert("Greška pri povezivanju Google Calendar-a");
      }
    },
  });

  const formatSlot = (slot) => {
    const t = (slot.time || "").slice(0, 5); // "12:10:00" -> "12:10"
    const d = slot.date || "";
    const place =
      slot.format === "Online"
        ? "Online"
        : slot.location?.trim()
        ? slot.location
        : "Uživo";

    return `${d} ${t} • ${place}`;
  };
  useEffect(() => {
    if (!instructor_id) return;

    const fetchReviews = async () => {
      try {
        setLoadingReviews(true);

        const res = await api.get(`/api/instructor/reviews/${instructor_id}/`);
        setReviews(res.data);
      } catch (e) {
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [instructor_id]);

  const renderStars = (rating) => {
    const maxStars = 5;
    const rounded = Math.round(rating);

    return (
      <div className="flex gap-0.5">
        {Array.from({ length: maxStars }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rounded
                ? "text-[#3674B5] fill-[#3674B5]"
                : "text-[#3674B5]/30"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="w-full">
        <div className="relative mx-auto w-full max-w-5xl rounded-3xl bg-[#D1F8EF] p-5 sm:p-7">
          {/* Close */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-xl bg-white/70 text-2xl text-[#3674B5] hover:bg-white"
              aria-label="Zatvori"
            >
              ✕
            </button>
          )}

          {/* GOOGLE CALENDAR CONNECT – FORCED VISIBLE */}
          <button
            onClick={() => connectCalendar()}
            className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-[#3674B5] font-semibold hover:bg-white/90"
          >
            Poveži Google kalendar
          </button>

          {/* TOP */}
          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Avatar */}
            <div className="lg:col-span-3">
              <div className="h-[180px] w-full max-w-[220px] overflow-hidden rounded-2xl bg-[#808080] sm:h-[210px]">
                <img
                  src={avatarUrl || defaultAvatar}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Text */}
            <div className="lg:col-span-9">
              <h1 className="text-[#215993] text-3xl sm:text-5xl font-semibold leading-tight">
                {fullName}
              </h1>

              <div className="mt-3 text-[#3674B5] text-base sm:text-lg leading-snug">
                <span className="font-bold">Biografija: </span>
                <span className="font-normal">{bio}</span>
              </div>

              <div className="mt-2 text-[#3674B5]/90 text-base sm:text-lg">
                <span className="font-bold">Lokacija: </span>
                <span className="font-normal">{location}</span>

                {user?.location && (
                  <div className="mt-4 h-56">
                    <GoogleMapEmbed
                      location={user.location}
                      className="h-full w-full"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* MAIN */}
          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* LEFT */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl bg-[#215993] p-5 text-[#D1F8EF]">
                <div className="absolute right-4 top-4 rounded-full bg-[#3674B5] px-4 py-2 text-lg font-semibold">
                  {priceLabel}
                </div>

                <h2 className="text-lg sm:text-xl font-semibold">Područja</h2>

                <div className="mt-4 flex flex-wrap gap-2 pr-[88px]">
                  {(subjects.length ? subjects : ["—"])
                    .slice(0, 8)
                    .map((s, i) => (
                      <span
                        key={`${s}-${i}`}
                        className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-sm sm:text-base"
                      >
                        {s}
                      </span>
                    ))}
                </div>
              </div>
            </div>

            {/* RIGHT – Kalendar */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl bg-[#3674B5] p-5 sm:p-6 text-[#D1F8EF]">
                <div className="text-lg sm:text-xl font-semibold text-center">
                  Kalendar
                </div>
                {/* RIGHT: Google Calendar */}
                <div className="lg:col-span-7">
                  <div className="rounded-2xl bg-[#3674B5] p-5 sm:p-6 text-[#D1F8EF]">
                    <div className="text-lg sm:text-xl font-semibold text-center mb-4">
                      Kalendar instruktora
                    </div>

                    {user?.google_calendar_email ? (
                      <div className="w-full h-[500px] rounded-xl overflow-hidden bg-white">
                        <iframe
                          title="Google Calendar"
                          src={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(
                            user.google_calendar_email
                          )}&ctz=Europe/Zagreb`}
                          style={{ border: 0 }}
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          scrolling="no"
                        />
                      </div>
                    ) : (
                      <div className="text-center text-white/80">
                        Instruktor još nije povezao Google kalendar.
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-white/10 p-4">
                  <div className="mt-3 flex flex-wrap gap-2">
                    {lessons.length ? (
                      lessons.slice(0, 10).map((slot) => (
                        <span
                          key={slot.lesson_id}
                          className="rounded-full bg-white/15 px-3 py-1 text-sm"
                        >
                          {formatSlot(slot)}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full bg-white/15 px-3 py-1 text-sm">
                        Nema termina
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          {canEdit && (
            <div className="mt-6">
              <Link
                to={editTo}
                className="block w-full text-center rounded-xl bg-[#215993] px-4 py-3 text-[#D1F8EF] font-semibold hover:brightness-110"
              >
                Uredi
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
