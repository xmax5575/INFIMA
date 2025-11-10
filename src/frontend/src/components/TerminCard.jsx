import React from "react";
import { Calendar, Clock, MapPin, Video, User, Trash2 } from "lucide-react";

export default function TerminCard() {
  if (!session) return null;

  return (
    <div className="relative max-w-sm bg-[#D1F8EF]/90 shadow-md hover:shadow-lg transition-shadow rounded-2xl p-6 text-[#3674B5]">
      {/* Gumb za brisanje (samo instruktor vidi) */}
      {showDelete && (
        <button
          onClick={onDelete}
          className="absolute top-3 right-3 text-[#3674B5]/70 hover:text-red-600 transition"
        >
          <Trash2 size={20} />
        </button>
      )}

      {/* Naslov i cijena */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">{session.subject}</h2>
        <span className="text-lg font-bold">{session.price} €</span>
      </div>

      {/* Detalji termina */}
      <div className="text-sm space-y-2">
        <div className="flex items-center gap-2">
          <Calendar size={16} />
          <span>{session.date}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} />
          <span>
            {session.time} • {session.duration} min
          </span>
        </div>
        <div className="flex items-center gap-2">
          {session.format === "Online" ? (
            <Video size={16} />
          ) : (
            <MapPin size={16} />
          )}
          <span>{session.location}</span>
        </div>
      </div>

      {/* Instruktor */}
      {session.instructor && (
        <div className="border-t border-[#A1E3F9] mt-4 pt-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#A1E3F9] flex items-center justify-center">
              <User size={20} className="text-[#3674B5]" />
            </div>
            <div>
              <p className="font-medium">
                {session.instructor.first_name} {session.instructor.last_name}
              </p>
              <p className="text-sm text-[#3674B5]/70">
                {session.instructor.email}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gumb rezerviraj */}
      <button className="w-full mt-5 bg-[#3674B5] hover:bg-[#2b5a91] text-[#D1F8EF] py-2 rounded-xl font-medium transition-transform hover:scale-105">
        Rezerviraj
      </button>
    </div>
  );
}
