import React, { useState } from "react";
import { Upload, FileText } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { supabase } from "../supabaseClient";
async function uploadLessonSummary(file, lessonId) {
  const ext = file.name.split(".").pop();
  const storageFileName = `${crypto.randomUUID()}.${ext}`;
  const path = `summary/${lessonId}/${storageFileName}`;

  const { error } = await supabase.storage
    .from("media")
    .upload(path, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from("media")
    .getPublicUrl(path);

  return {
    publicUrl: data.publicUrl,
    originalName: file.name, // ⬅️ OVO
    storagePath: path,
  };
}


export default function SummaryUpload() {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const generateFileName = (file) => {
  const ext = file.name.split(".").pop();
  return `summary-${Date.now()}.${ext}`;
};

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

  if (!file) {
    setError("Molimo odaberite dokument.");
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const uploadResult = await uploadLessonSummary(file, lessonId);

    await api.post(`/api/lesson/${lessonId}/summary/`, {
      file_url: uploadResult.publicUrl,
      file_name: uploadResult.originalName, // ⬅️ BITNO
  
    });

    navigate(`/home/instructor`);
  } catch (err) {
    console.error(err);
    setError("Greška pri uploadu sažetka.");
  } finally {
    setLoading(false);
  }
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
