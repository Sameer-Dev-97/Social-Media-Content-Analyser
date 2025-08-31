// src/utils/ocr.js
import Tesseract from 'tesseract.js';

export async function extractTextFromImage(file, onProgress = () => {}) {
  const url = URL.createObjectURL(file);
  try {
    const result = await Tesseract.recognize(url, 'eng', {
      logger: m => onProgress(m),
    });
    return result.data.text;
  } finally {
    URL.revokeObjectURL(url);
  }
}
