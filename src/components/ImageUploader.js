// src/components/ImageUploader.js
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ImageUploader({ bucketName = 'banners', onUpload }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileChange = async (event) => {
    setUploading(true);
    const file = event.target.files[0];
    if (!file) return;

    // Vista previa
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `${bucketName}/${fileName}`;

    // Subir a Supabase Storage
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error al subir:', error);
      setUploading(false);
      return;
    }

    // Obtener URL pública
    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    if (onUpload) onUpload(data.publicUrl);
    setUploading(false);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', marginBottom: 6, color: '#DDD6FE' }}>
        {uploading ? 'Subiendo...' : 'Seleccionar imagen'}
      </label>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        style={{ width: '100%' }}
      />
      {preview && (
        <div style={{ marginTop: 8 }}>
          <img
            src={preview}
            alt="Vista previa"
            style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 8 }}
          />
        </div>
      )}
    </div>
  );
}