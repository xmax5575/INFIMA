import { useState, useEffect } from "react";
import Header from "../components/Header";
import TerminForm from "../components/TerminForm";
import TerminCard from "../components/TerminCard";
import { ACCESS_TOKEN } from "../constants";
import api from "../api";

function Instructor() {
  const [showForm, setShowForm] = useState(false);
  const [termini, setTermini] = useState([]);
  const [user, setUser] = useState(null);

  //uzmi trenutnog koristika i njegiv accesstoken
  
  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      api
        .get("/api/user/profile/", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setUser(res.data))
        .catch(() => setUser(null));
    }
  }, []);

 

  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3674B5] to-[#A1E3F9] font-[Outfit] flex flex-col pt-24">
      <Header />

      

      {/* gumb za dodavanje */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-[#D1F8EF] text-[#3674B5] text-3xl font-bold
          shadow hover:shadow-lg transition-transform hover:scale-110 flex items-center justify-center
          border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3674B5]/40"
      >
        +
      </button>

      {/* forma */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 overflow-y-auto"
          onClick={() => setShowForm(false)}
        >
          <div
            className="relative bg-[#D1F8EF] text-[#3674B5] rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 max-h-[90vh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4 text-center">Novi termin</h2>
            <TerminForm/>

          </div>
        </div>
      )}
    </div>
  );
}

export default Instructor;
