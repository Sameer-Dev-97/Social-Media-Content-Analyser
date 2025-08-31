import React, { useState } from "react";
import FileUploader from "./components/FileUploader";
import { extractTextFromPDF } from "./utils/pdfExtract";
import { extractTextFromImage } from "./utils/ocr";
import { analyzeWithGemini } from "./utils/gemini";
import "./styles.css";

// Custom JS analysis
function generateAnalysis(text) {
  let analysis = [];
  if (text.match(/python|javascript|c\+\+|c\b/i)) {
    analysis.push(
      "This post shows good programming skills, including Python, JavaScript, C, and C++."
    );
  }
  if (text.match(/project/i)) {
    analysis.push(
      "The post references projects, which adds value for recruiters."
    );
  }
  if (text.match(/github|linkedin/i)) {
    analysis.push("Social/technical online profiles are clearly included.");
  }
  if (text.length < 300) {
    analysis.push(
      "Post is short; consider adding more on achievements or project outcomes."
    );
  }
  return analysis.join(" ");
}

// Suggestions function remains unchanged
function suggestImprovements(text) {
  const suggestions = [];
  const words = (text || "").split(/\s+/).filter(Boolean).length;
  const longSent = (text.match(/[^.!?]+[.!?]/g) || []).some(
    (s) => s.split(/\s+/).length > 25
  );
  const hashtags = (text.match(/#\w+/g) || []).length;

  if (words > 250) suggestions.push("Shorten the post (aim 150–250 words).");
  if (longSent)
    suggestions.push("Break long sentences into shorter ones (~20 words).");
  if (hashtags < 2) suggestions.push("Add 2–4 relevant hashtags.");
  suggestions.push("Include a clear CTA (ask readers to comment/share).");

  return suggestions;
}

export default function App() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  async function handleFiles(files) {
    const newItems = files.map((f) => ({
      file: f,
      status: "queued",
      text: "",
      progress: 0,
      suggestions: [],
      analysis: "",
      isGemini: false, // Track if Gemini analysis was done
    }));
    setItems((prev) => [...newItems, ...prev]);

    for (const [fileIdx, it] of newItems.entries()) {
      try {
        it.status = "processing";
        setItems((prev) => [...prev]);

        let extracted = "";
        if (
          it.file.type === "application/pdf" ||
          it.file.name.toLowerCase().endsWith(".pdf")
        ) {
          extracted = await extractTextFromPDF(it.file, () => {});
        } else if (
          it.file.type.startsWith("image/") ||
          /\.(jpe?g|png|gif|tiff?)$/i.test(it.file.name)
        ) {
          extracted = await extractTextFromImage(it.file, (m) => {
            it.progress = m.progress
              ? Math.round(m.progress * 100)
              : it.progress;
            setItems((prev) => [...prev]);
          });
        } else {
          throw new Error("Unsupported file type");
        }
        // Generate custom JS analysis and display immediately
        it.text = extracted;
        it.status = "done";
        it.suggestions = suggestImprovements(extracted);
        it.analysis = generateAnalysis(extracted);
        it.isGemini = false;
        setItems((prevItems) =>
          prevItems.map((item, idx) =>
            idx === fileIdx ? { ...item, ...it } : item
          )
        );

        // Now, auto-generate Gemini (AI) analysis and update it
        setItems((prevItems) =>
          prevItems.map((item, idx) =>
            idx === fileIdx
              ? {
                  ...item,
                  analysis: "Analyzing with Gemini...",
                  isGemini: true,
                }
              : item
          )
        );
        const geminiAnalysis = await analyzeWithGemini(extracted);
        setItems((prevItems) =>
          prevItems.map((item, idx) =>
            idx === fileIdx
              ? { ...item, analysis: geminiAnalysis, isGemini: true }
              : item
          )
        );
      } catch (err) {
        it.status = "error";
        it.text = "";
        it.error = String(err.message || err);
        setError(err.message || err);
        setItems((prevItems) =>
          prevItems.map((item, idx) =>
            idx === fileIdx ? { ...item, ...it } : item
          )
        );
      }
    }
  }

  function downloadTxt(text, name = "extracted.txt") {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app">
      <h1>Social Media Content Analyzer</h1>
      <FileUploader onFiles={handleFiles} />

      {error && <div className="error">{error}</div>}

      <div className="results">
        {items.map((it, idx) => (
          <div className="card" key={idx}>
            <strong>
              {it.file.name} ({it.file.type})
            </strong>
            <div>
              Status: {it.status} {it.progress ? ` - ${it.progress}%` : ""}
            </div>

            {(it.status === "done" || it.isGemini) && (
              <>
                {/* Buttons */}
                <button
                  onClick={() => downloadTxt(it.text, it.file.name + ".txt")}
                >
                  Download .txt
                </button>
                <button onClick={() => navigator.clipboard.writeText(it.text)}>
                  Copy Text
                </button>

                <div className="extracted-section">
                  <h4>Extracted Text</h4>
                  <pre className="extracted scrollable">{it.text}</pre>
                </div>

                {/* Post Analysis */}
                <div className="analysis">
                  <h4>Post Analysis</h4>
                  {it.analysis && it.analysis.trim().length > 0 ? (
                    <ul>
                      {it.analysis
                        .split(/(?<=[.?!])\s+/) // split by punctuation+space
                        .filter((sent) => sent.trim().length > 0) // non-empty
                        .map((sent, idx) => (
                          <li key={idx}>{sent.trim()}</li>
                        ))}
                    </ul>
                  ) : (
                    <p>
                      <em>No analysis yet. Processing...</em>
                    </p>
                  )}
                </div>

                {/* Suggestions */}
                <div className="analysis">
                  <h4>Suggestions / Engagement improvements.</h4>
                  <ul>
                    {it.analysis
                      .split("\n")
                      .filter((line) => line.trim().startsWith("-"))
                      .map((line, idx) => (
                        <li key={idx}>{line.replace(/^-\s*/, "").trim()}</li>
                      ))}
                  </ul>
                </div>
              </>
            )}

            {it.status === "error" && <div className="error">{it.error}</div>}
            {it.status === "processing" && (
              <div>Processing... {it.progress ? `${it.progress}%` : ""}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
