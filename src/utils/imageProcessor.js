// src/utils/imageProcessor.js

const DEFAULTS = {
  maxWidth: 1200,
  targetSizeKB: 220,
  minQuality: 0.55,
  initialQuality: 0.85,
  qualityStep: 0.05
};

/**
 * Detecta si el navegador soporta WebP
 */
async function supportsWebP() {
  if (!("createImageBitmap" in window)) return false;


  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob?.type === "image/webp");
    }, "image/webp");
  });
}

/**
 * Fallback compatible con Safari
 */
function loadImageFallback(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Procesador PRO con compresión progresiva
 */
export async function processImagePro(file, options = {}) {
  const config = { ...DEFAULTS, ...options };

  let width;
  let height;
  let imageSource;

  try {
    if ("createImageBitmap" in window) {
      imageSource = await createImageBitmap(file);
      width = imageSource.width;
      height = imageSource.height;
    } else {
      imageSource = await loadImageFallback(file);
      width = imageSource.width;
      height = imageSource.height;
    }
  } catch (error) {
    throw new Error("No se pudo cargar la imagen");
  }

  // Mantener proporción
  if (width > config.maxWidth) {
    const ratio = config.maxWidth / width;
    width = config.maxWidth;
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.drawImage(imageSource, 0, 0, width, height);

  const useWebP = await supportsWebP();
  const mimeType = useWebP ? "image/webp" : "image/jpeg";

  let quality = config.initialQuality;
  let blob = null;

  // 🔥 Compresión progresiva inteligente
  while (quality >= config.minQuality) {
    blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, mimeType, quality)
    );

    if (!blob) break;

    const sizeKB = blob.size / 1024;

    if (sizeKB <= config.targetSizeKB) {
      break;
    }

    quality -= config.qualityStep;
  }

  if (!blob) {
    throw new Error("Error procesando imagen");
  }

// Limpieza memoria
if (imageSource.close) imageSource.close();

return blob;
}

// Procesamiento múltiple
export async function processMultipleImagesPro(files, options = {}) {
  const results = [];

  for (const file of files) {
    try {
      const processed = await processImagePro(file, options);
      results.push(processed);
    } catch (error) {
      console.error("Error procesando imagen:", error);
    }
  }

  return results;
}

// ✅ Alias compatibilidad legacy
export const processImage = processImagePro;
export const processMultipleImages = processMultipleImagesPro;
