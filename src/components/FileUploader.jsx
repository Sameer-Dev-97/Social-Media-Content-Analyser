import React, { useRef } from "react";
import "./FileUploader.css";

export default function FileUploader({ onFiles }) {
  const fileInputRef = useRef();

  function handleFiles(e) {
    const files = Array.from(e.target.files || e.dataTransfer.files);
    if (files.length) onFiles(files);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e);
  }

  return (
    <div className="uploader-container">
      <div
        className="drop-area"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
        tabIndex={0}
        role="button"
        aria-label="Upload files"
        onKeyPress={e => {
          if (e.key === "Enter" || e.key === " ") {
            fileInputRef.current.click();
          }
        }}
      >
        <div className="uploader-icon">
          <svg width="48" height="48" fill="none" viewBox="0 0 48 48">
            <rect width="48" height="48" rx="16" fill="#007bff" fillOpacity="0.1"/>
            <path d="M24 33V15M24 15l-6 6M24 15l6 6" stroke="#007bff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="large">Drag & drop <strong>PDF</strong> or <strong>Image</strong> files here</p>
        <p className="or-text">or</p>
        <button type="button" className="custom-btn">Select Files</button>
        <input
          type="file"
          multiple
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFiles}
          accept=".pdf,image/*"
        />
        <p className="hint">Maximum 25MB per file</p>
      </div>
    </div>
  );
}
