import { useEffect, useState } from "react";
import Header from "../components/Header";
import TerminCard from "../components/TerminCard";

function Student() {
  const [termini, setTermini] = useState([]);


  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3674B5] to-[#A1E3F9] font-[Outfit] flex flex-col">
      <Header />
      
    </div>
  );
}

export default Student;
