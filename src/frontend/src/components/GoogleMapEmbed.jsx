export default function GoogleMapEmbed({ location, className = "" }) {
  //prikazivanje karte samo ako je lokacija postojeća
  //pretvaranje string u sigurni format za URL
  if (!location) return null;

  const src = `https://www.google.com/maps?q=${encodeURIComponent(
    location,
  )}&output=embed`;

  //renderanje google karte iframe za lokaciju instruktora
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
