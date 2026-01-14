import React, { useState } from "react";
import { Upload, FileText } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";

export default function SummaryUpload() {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Dozvoljeni su samo PDF ili Word dokumenti.");
      return;
    }

    setError(null);
    setFile(selectedFile);
  };

  const submitSummary = async (e) => {
    e.preventDefault();
    /*if (!file) {
      setError("Molimo odaberite dokument.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("summary", file);

    try {
      await api.post(
        `/api/lessons/${lessonId}/summary/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      navigate("/home/instructor");
    } catch (err) {
      setError("Neuspješan upload sažetka.");
    } finally {
      setLoading(false);
    }*/
  };

  return (
     <div className="min-h-screen bg-[#215993] flex items-center justify-center px-4">
    <div className="w-full max-w-4xl rounded-[2.5rem] bg-[#3674B5]/20 p-6">
      
    <div className="w-full max-w-3xl mx-auto rounded-3xl bg-[#D1F8EF] p-8">
      <form
        onSubmit={submitSummary}
        className="rounded-2xl bg-white/70 p-6 space-y-6"
      >
        {/* NASLOV */}
        <h2 className="text-center text-2xl sm:text-3xl font-semibold text-[#215993]">
          Upload sažetka instrukcija
        </h2>

        {error && <p className="text-red-600">{error}</p>}

        {/* FILE INPUT */}
        <div>
          <div className="mb-2 text-sm sm:text-base font-semibold text-[#3674B5]">
            Dokument (PDF ili Word)
          </div>

          <label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-[#3674B5]/40 bg-white px-4 py-6 text-[#3674B5] hover:bg-white/80">
            <Upload className="h-6 w-6" />
            <span>
              {file ? file.name : "Klikni za odabir dokumenta"}
            </span>

            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {/* PREVIEW */}
        {file && (
          <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-[#215993]">
            <FileText className="h-5 w-5 text-[#3674B5]" />
            <span className="text-sm">{file.name}</span>
          </div>
        )}

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={loading || !file}
          className="w-full rounded-xl bg-[#215993] px-4 py-3 font-semibold text-[#D1F8EF] hover:brightness-110 disabled:opacity-40"
        >
          {loading ? "Uploadam..." : "Spremi sažetak"}
        </button>
      </form>
    </div>
    </div>
    </div>
  );
}
