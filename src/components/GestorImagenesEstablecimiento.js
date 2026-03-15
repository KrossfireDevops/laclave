// src/components/GestorImagenesEstablecimiento.js
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { processImage } from '../utils/imageProcessor';

export default function GestorImagenesEstablecimiento({ establecimiento, onClose, onSave }) {

  const [imagenes, setImagenes] = useState(establecimiento.imagenes || []);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [errorMessages, setErrorMessages] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  /* ==============================
     PREVENIR DROP GLOBAL DEL BROWSER
  ============================== */
  useEffect(() => {
    const preventDefault = (e) => e.preventDefault();
    window.addEventListener("dragover", preventDefault);
    window.addEventListener("drop", preventDefault);

    return () => {
      window.removeEventListener("dragover", preventDefault);
      window.removeEventListener("drop", preventDefault);
    };
  }, []);

  /* ==============================
     VALIDAR ARCHIVOS
  ============================== */
  const validateFiles = (selectedFiles) => {

    if (selectedFiles.some(f => !f.type.match('image.*'))) {
      alert('⚠️ Solo se permiten imágenes');
      return false;
    }

    if (selectedFiles.length + imagenes.length > 10) {
      alert(`⚠️ Máximo 10 imágenes.`);
      return false;
    }

    return true;
  };

  /* ==============================
     HANDLE INPUT CHANGE
  ============================== */
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (!selectedFiles.length) return;

    if (!validateFiles(selectedFiles)) return;

    setFiles(selectedFiles);
    setErrorMessages([]);
  };

  /* ==============================
     DRAG & DROP
  ============================== */
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (!droppedFiles.length) return;

    if (!validateFiles(droppedFiles)) return;

    setFiles(droppedFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  /* ==============================
     SUBIR IMÁGENES
  ============================== */
  const uploadImages = async () => {

    if (!files.length) return imagenes;

    setUploading(true);
    setProcessing(true);
    setProcessedCount(0);

    const uploadedUrls = [...imagenes];

    try {
      for (let i = 0; i < files.length; i++) {

        const file = files[i];
        setProcessedCount(i + 1);

        if (file.size > 10 * 1024 * 1024) {
          setErrorMessages(prev => [...prev, `❌ ${file.name} excede 10MB`]);
          continue;
        }

        const processedBlob = await processImage(file, {
          width: 800,
          height: 600,
          quality: 0.85,
          maintainRatio: true,
          maxSizeMB: 1
        });

        const fileName = `${establecimiento.id}_${Date.now()}_${i}.jpg`;
        const filePath = `establecimientos/${fileName}`;

        const { error } = await supabase.storage
          .from('establecimientos')
          .upload(filePath, processedBlob, {
            contentType: 'image/jpeg'
          });

        if (error) throw error;

        const { data } = supabase.storage
          .from('establecimientos')
          .getPublicUrl(filePath);

        uploadedUrls.push(data.publicUrl);
      }

      return uploadedUrls;

    } catch (err) {
      alert("❌ Error al subir imágenes: " + err.message);
      return imagenes;
    } finally {
      setUploading(false);
      setProcessing(false);
      setFiles([]);
      setProcessedCount(0);
    }
  };

  /* ==============================
     GUARDAR
  ============================== */
  const handleSave = async () => {

    const newImages = await uploadImages();

    const { error } = await supabase
      .from('establecimientos')
      .update({
        imagenes: newImages,
        updated_at: new Date().toISOString()
      })
      .eq('id', establecimiento.id);

    if (error) {
      alert("❌ Error al guardar");
      return;
    }

    onSave({ ...establecimiento, imagenes: newImages });
    onClose();
  };

  /* ==============================
     UI
  ============================== */
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1F2937',
          padding: 30,
          borderRadius: 16,
          width: '100%',
          maxWidth: 700
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: 20 }}>
          🖼️ Imágenes de "{establecimiento.nombre}"
        </h2>

        {/* ZONA DROP */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            border: dragActive
              ? '2px solid #10B981'
              : '2px dashed rgba(192,132,252,0.4)',
            padding: 40,
            textAlign: 'center',
            borderRadius: 12,
            cursor: 'pointer',
            background: dragActive
              ? 'rgba(16,185,129,0.08)'
              : 'rgba(30,30,45,0.5)',
            transition: 'all .2s'
          }}
        >
          {files.length > 0
            ? `✅ ${files.length} imagen(es) seleccionada(s)`
            : 'Haz clic o arrastra imágenes aquí'}
        </div>

        {/* INPUT NORMAL */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* INPUT CÁMARA */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* BOTONES */}
        <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
          <button
            onClick={() => fileInputRef.current?.click()}
          >
            📂 Seleccionar
          </button>

          <button
            onClick={() => cameraInputRef.current?.click()}
          >
            📸 Tomar fotografía
          </button>
        </div>

        {/* GUARDAR */}
        <div style={{ marginTop: 20 }}>
          <button
            disabled={uploading || processing}
            onClick={handleSave}
          >
            {processing
              ? `Procesando ${processedCount}/${files.length}`
              : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}