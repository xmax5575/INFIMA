// src/components/GoogleMapEmbed.jsx
import React from "react";

export default function GoogleMapEmbed({ location, className = "" }) {
  if (!location) return null;

  const src = `https://www.google.com/maps?q=${encodeURIComponent(
    location
  )}&output=embed`;

  return (
    <iframe
      title="map"
      src={src}
      className={`w-full h-full rounded-xl border-0 ${className}`}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
