// src/components/ImageUploader.js
import React, { useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { processImagePro } from "../utils/imageProcessor";

export default function ImageUploader({
  bucketName = "banners",
  onUpload,
  maxWidth = 1600,
  targetSizeKB = 300
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // ===============================
  // PROCESAMIENTO + SUBIDA
  // ===============================
  const handleFile = async (file) => {
    if (!file) return;

    try {
      setUploading(true);

      // Vista previa inmediata
      setPreview(URL.createObjectURL(file));

      // 🔥 Compresión PRO
      const optimizedBlob = await processImagePro(file, {
        maxWidth,
        targetSizeKB
      });

      const fileName = `${Date.now()}.webp`;
      const filePath = `${fileName}`;

      const { error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, optimizedBlob, {
          cacheControl: "3600",
          upsert: false,
          contentType: "image/webp"
        });

      if (error) throw error;

      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (onUpload) onUpload(data.publicUrl);

    } catch (err) {
      console.error("Error al subir imagen:", err);
      alert("Error al subir imagen");
    } finally {
      setUploading(false);
    }
  };

  // ===============================
  // INPUT NORMAL
  // ===============================
  const handleChange = (e) => {
    if (!e.target.files?.length) return;
    handleFile(e.target.files[0]);
  };

  // ===============================
  // DRAG & DROP
  // ===============================
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files?.length) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // ===============================
  // RENDER
  // ===============================
  return (
    <div style={{ marginBottom: 20 }}>
      {/* DROP AREA */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          border: dragActive
            ? "2px solid #34D399"
            : "2px dashed rgba(192,132,252,0.5)",
          borderRadius: 16,
          padding: 30,
          textAlign: "center",
          background: dragActive
            ? "rgba(16,185,129,0.1)"
            : "rgba(30,30,45,0.5)",
          transition: "all 0.2s ease",
          cursor: "pointer"
        }}
        onClick={() => fileInputRef.current.click()}
      >
        <p style={{ color: "#DDD6FE", marginBottom: 8 }}>
          {uploading
            ? "Subiendo imagen..."
            : "Arrastra y suelta tu imagen aquí"}
        </p>

        <p style={{ color: "#94a3b8", fontSize: 13 }}>
          o haz clic para seleccionar desde tu dispositivo
        </p>

        <div style={{ marginTop: 16, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current.click();
            }}
            style={buttonStyle}
          >
            🖼 Galería
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              cameraInputRef.current.click();
            }}
            style={{ ...buttonStyle, background: "#111" }}
          >
            📸 Cámara
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          style={{ display: "none" }}
        />

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleChange}
          style={{ display: "none" }}
        />
      </div>

      {/* PREVIEW */}
      {preview && (
        <div style={{ marginTop: 16 }}>
          <img
            src={preview}
            alt="Vista previa"
            style={{
              width: "100%",
              maxHeight: 200,
              objectFit: "cover",
              borderRadius: 12
            }}
          />
        </div>
      )}
    </div>
  );
}

// ===============================
// ESTILO BOTÓN
// ===============================
const buttonStyle = {
  background: "#C084FC",
  color: "#fff",
  border: "none",
  padding: "8px 14px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: "bold"
};