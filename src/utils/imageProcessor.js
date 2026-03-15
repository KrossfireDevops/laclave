// src/utils/imageProcessor.js
/**
 * Módulo de procesamiento de imágenes para LaClave
 * - Compresión progresiva inteligente
 * - Soporte WebP automático
 * - Gestión segura de memoria
 * - Compatible con Safari y navegadores modernos
 */

// =====================================================
// CONFIGURACIÓN POR DEFECTO
// =====================================================

const DEFAULTS = {
  maxWidth: 1200,
  targetSizeKB: 220,
  minQuality: 0.55,
  initialQuality: 0.85,
  qualityStep: 0.05
};

// =====================================================
// FUNCIONES HELPER (Definidas primero para evitar hoisting)
// =====================================================

/**
 * Crea un Blob desde un canvas con la calidad especificada
 * @param {HTMLCanvasElement} canvas - El canvas a convertir
 * @param {string} mimeType - Tipo MIME (image/webp o image/jpeg)
 * @param {number} quality - Calidad de compresión (0.0 a 1.0)
 * @returns {Promise<Blob|null>} El Blob resultante o null si falla
 */
function createBlobFromCanvas(canvas, mimeType, quality) {
  return new Promise((resolve) => {
    try {
      if (!canvas || typeof canvas.toBlob !== 'function') {
        resolve(null);
        return;
      }
      canvas.toBlob((blob) => resolve(blob), mimeType, quality);
    } catch (error) {
      console.warn('Error creando blob:', error);
      resolve(null);
    }
  });
}

/**
 * Detecta si el navegador soporta formato WebP
 * @returns {Promise<boolean>} True si WebP es compatible
 */
async function supportsWebP() {
  if (!("createImageBitmap" in window)) return false;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob?.type === "image/webp");
      }, "image/webp");
    });
  } catch {
    return false;
  }
}

/**
 * Carga una imagen con fallback compatible para Safari
 * @param {File} file - Archivo de imagen a cargar
 * @returns {Promise<HTMLImageElement>} La imagen cargada
 */
function loadImageFallback(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectURL = URL.createObjectURL(file);

    const cleanup = () => {
      URL.revokeObjectURL(objectURL);
    };

    img.onload = () => {
      cleanup();
      resolve(img);
    };
    
    img.onerror = (error) => {
      cleanup();
      reject(new Error(`Error cargando imagen: ${error.message || 'Unknown error'}`));
    };

    img.src = objectURL;
  });
}

// =====================================================
// FUNCIÓN PRINCIPAL: Procesamiento de imagen individual
// =====================================================

/**
 * Procesa una imagen con compresión progresiva inteligente
 * @param {File} file - Archivo de imagen a procesar
 * @param {Object} options - Opciones de configuración
 * @returns {Promise<Blob>} El Blob de la imagen procesada
 * @throws {Error} Si falla el procesamiento
 */
export async function processImagePro(file, options = {}) {
  const config = { ...DEFAULTS, ...options };

  let width;
  let height;
  let imageSource;

  // 1️⃣ Cargar la imagen
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
    throw new Error(`No se pudo cargar la imagen: ${error.message}`);
  }

  // 2️⃣ Redimensionar manteniendo proporción
  if (width > config.maxWidth) {
    const ratio = config.maxWidth / width;
    width = config.maxWidth;
    height = Math.round(height * ratio);
  }

  // 3️⃣ Dibujar en canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { alpha: false, willReadFrequently: true });
  ctx.drawImage(imageSource, 0, 0, width, height);

  // 4️⃣ Determinar formato de salida
  const useWebP = await supportsWebP();
  const mimeType = useWebP ? "image/webp" : "image/jpeg";

  // 5️⃣ Compresión progresiva inteligente
  let quality = config.initialQuality;
  let blob = null;

  while (quality >= config.minQuality) {
    blob = await createBlobFromCanvas(canvas, mimeType, quality);

    if (!blob) break;

    const sizeKB = blob.size / 1024;
    if (sizeKB <= config.targetSizeKB) {
      break;
    }

    quality -= config.qualityStep;
  }

  // 6️⃣ Validar resultado
  if (!blob) {
    throw new Error("Error procesando imagen: no se pudo generar el blob");
  }

  // 7️⃣ Limpieza de memoria
  if (typeof imageSource?.close === "function") {
    imageSource.close();
  }

  return blob;
}

// =====================================================
// FUNCIÓN: Procesamiento múltiple de imágenes
// =====================================================

/**
 * Procesa múltiples imágenes en paralelo con manejo de errores individual
 * @param {File[]} files - Array de archivos de imagen
 * @param {Object} options - Opciones de configuración
 * @returns {Promise<Blob[]>} Array de Blobs procesados exitosamente
 */
export async function processMultipleImagesPro(files, options = {}) {
  if (!Array.isArray(files) || files.length === 0) {
    return [];
  }

  const results = [];

  for (const file of files) {
    try {
      if (file?.type?.startsWith('image/')) {
        const processed = await processImagePro(file, options);
        results.push(processed);
      } else {
        console.warn(`Archivo ignorado (no es imagen): ${file?.name || 'unknown'}`);
      }
    } catch (error) {
      console.error(`Error procesando "${file?.name || 'unknown'}":`, error);
      // Continuamos con el siguiente archivo (fail-soft)
    }
  }

  return results;
}

// =====================================================
// ALIASES PARA COMPATIBILIDAD LEGACY (Siempre al final)
// =====================================================

/**
 * Alias para mantener compatibilidad con código anterior
 * @deprecated Usar processImagePro directamente
 */
export const processImage = processImagePro;

/**
 * Alias para mantener compatibilidad con código anterior
 * @deprecated Usar processMultipleImagesPro directamente
 */
export const processMultipleImages = processMultipleImagesPro;