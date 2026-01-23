import { useEffect, useState } from "react";

export default function LogoBulbLoader() {
  const total = 5;
  const [active, setActive] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev >= total ? 1 : prev + 1));
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex gap-3">
        {
          Array.from({ length: total }).map((_, i) => (
            <img
              key={i}
              src="../../public/images/infima.png"
              alt=""
              className={`w-8 transition-all duration-300 ${
                i < active
                  ? "opacity-100 drop-shadow-[0_0_10px_#3674B5]"
                  : "opacity-30 grayscale"
              }`}
            />
          ))
        }
      </div>
    </div>
  );
}
