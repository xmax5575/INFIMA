import { useEffect, useState } from "react";

function LoadingPage() {
  const [play, setPlay] = useState(false);

  useEffect(() => {
    setPlay(true);
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#3F7CC6]">
      <img
        src="/images/infima.png"
        alt="Infima logo"
        className={`
          w-40 sm:w-48 md:w-56 lg:w-64
          ${play ? "animate-logoIntro" : ""}
        `}
      />
    </div>
  );
}

export default LoadingPage;
