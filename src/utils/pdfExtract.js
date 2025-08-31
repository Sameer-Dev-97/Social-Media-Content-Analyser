// src/utils/pdfExtract.js
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?url"; // ✅ import worker locally

// tell pdf.js to use the bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export async function extractTextFromPDF(file, onProgress = () => {}) {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress({ type: "page", page: i, total: pdf.numPages });
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    const rows = {};
    content.items.forEach((item) => {
      const [a, b, c, d, e, f] = item.transform;
      const x = Math.round(e);
      const y = Math.round(f);
      if (!rows[y]) rows[y] = [];
      rows[y].push({ x, str: item.str });
    });

    const sortedYs = Object.keys(rows)
      .map(Number)
      .sort((a, b) => b - a);

    sortedYs.forEach((y) => {
      const line = rows[y]
        .sort((a, b) => a.x - b.x)
        .map((i) => i.str)
        .join(" ")
        .trim();
      fullText += line + "\n";
    });

    fullText += "\n";
  }

  return fullText.trim();
}
