// התקן את הספרייה הזו אם עוד לא:
// npm install tesseract.js

import React, { useState } from "react";
import Tesseract from "tesseract.js";
import { extractInvoiceData } from "../lib/extractInvoiceData";

export default function InvoiceOCRDemo() {
  const [image, setImage] = useState(null);
  const [ocrText, setOcrText] = useState("");
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      runOCR(file);
    }
  };

  const runOCR = async (file) => {
    setLoading(true);
    try {
      const { data } = await Tesseract.recognize(file, "eng+heb", {
        logger: (m) => console.log(m),
      });

      const text = data.text;
      setOcrText(text);

      const extractedData = extractInvoiceData(text);
      setExtracted(extractedData);
    } catch (err) {
      console.error("שגיאה ב-OCR:", err);
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        padding: "2rem",
        direction: "rtl",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2>🔍 זיהוי מסמכים עם OCR</h2>
      <input type="file" accept="image/*,.pdf" onChange={handleImageChange} />

      {loading && (
        <p style={{ color: "blue", marginTop: "1rem" }}>מזהה טקסט... המתן</p>
      )}

      {image && (
        <img
          src={image}
          alt="תצוגה מקדימה"
          style={{
            maxWidth: "300px",
            marginTop: "1rem",
            borderRadius: "8px",
            boxShadow: "0 0 5px #ccc",
          }}
        />
      )}

      {ocrText && (
        <div style={{ marginTop: "2rem" }}>
          <h3>📄 טקסט מזוהה:</h3>
          <pre
            style={{
              background: "#f5f5f5",
              padding: "1rem",
              whiteSpace: "pre-wrap",
              borderRadius: "8px",
            }}
          >
            {ocrText}
          </pre>
        </div>
      )}

      {extracted && (
        <div
          style={{
            marginTop: "2rem",
            background: "#e9f9e9",
            padding: "1rem",
            borderRadius: "8px",
          }}
        >
          <h3>📋 מידע שנשאב מהמסמך:</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            <li>
              <strong>💵 סכום:</strong> {extracted.amount || "לא זוהה"}
            </li>
            <li>
              <strong>🧾 מספר חשבונית:</strong>{" "}
              {extracted.invoice_number || "לא זוהה"}
            </li>
            <li>
              <strong>📅 תאריך:</strong> {extracted.date || "לא זוהה"}
            </li>
            <li>
              <strong>🏪 שם העסק:</strong>{" "}
              {extracted.business_name || "לא זוהה"}
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
