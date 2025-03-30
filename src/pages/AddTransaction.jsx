import { supabase } from "../lib/supabaseClient";
import React, { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam"; // צריך להתקין: npm install react-webcam

// קומפוננט מצלמה משופר עם ספריית react-webcam
const CameraUpload = ({ onImageCapture }) => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [facing, setFacing] = useState("environment"); // מצלמה אחורית כברירת מחדל
  const webcamRef = useRef(null);

  // פתיחת המצלמה
  const openCamera = () => {
    setShowCamera(true);
  };

  // סגירת המצלמה
  const closeCamera = () => {
    setShowCamera(false);
  };

  // החלפת מצלמה (קדמית/אחורית)
  const switchCamera = () => {
    setFacing(facing === "environment" ? "user" : "environment");
  };

  // צילום תמונה
  const captureImage = useCallback(() => {
    if (!webcamRef.current) {
      console.error("המצלמה לא מוכנה");
      return;
    }

    try {
      // צילום התמונה
      const imageSrc = webcamRef.current.getScreenshot();

      if (!imageSrc) {
        console.error("לא ניתן לצלם תמונה");
        alert("לא ניתן לצלם תמונה. אנא ודא שהמצלמה פעילה.");
        return;
      }

      // יצירת קובץ מהתמונה
      fetch(imageSrc)
        .then((res) => res.blob())
        .then((blob) => {
          const now = new Date();
          const fileName = `image_${now.getFullYear()}${(now.getMonth() + 1)
            .toString()
            .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}_${now
            .getHours()
            .toString()
            .padStart(2, "0")}${now
            .getMinutes()
            .toString()
            .padStart(2, "0")}${now
            .getSeconds()
            .toString()
            .padStart(2, "0")}.jpg`;

          const file = new File([blob], fileName, { type: "image/jpeg" });

          // שמירת התמונה והעברה לקומפוננט ההורה
          setCapturedImage(imageSrc);
          if (onImageCapture) {
            onImageCapture(file);
          }

          // סגירת המצלמה
          closeCamera();
        })
        .catch((err) => {
          console.error("שגיאה בעיבוד התמונה:", err);
          alert("אירעה שגיאה בעיבוד התמונה. נסה שנית.");
        });
    } catch (err) {
      console.error("שגיאה בצילום התמונה:", err);
      alert("אירעה שגיאה בצילום התמונה. נסה שנית.");
    }
  }, [webcamRef, onImageCapture]);

  // הגדרות מצלמה
  const videoConstraints = {
    facingMode: facing, // מצלמה קדמית או אחורית
    width: { ideal: 1280 },
    height: { ideal: 720 },
  };

  return (
    <div style={{ marginTop: "10px" }}>
      {!showCamera && !capturedImage && (
        <button
          type="button"
          onClick={openCamera}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 12px",
            background: "#4b5563",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
            <circle cx="12" cy="13" r="3"></circle>
          </svg>
          <span>צלם תמונה</span>
        </button>
      )}

      {showCamera && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#000",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "calc(100% - 80px)",
              overflow: "hidden",
            }}
          >
            {/* המסגרת למיקוד הצילום */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "80%",
                height: "80%",
                maxWidth: "500px",
                maxHeight: "500px",
                border: "2px solid rgba(255, 255, 255, 0.7)",
                borderRadius: "8px",
                boxShadow: "0 0 0 2000px rgba(0, 0, 0, 0.3)",
                zIndex: 2,
              }}
            />

            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              screenshotQuality={0.9}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              padding: "16px",
              backgroundColor: "#000",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              onClick={closeCamera}
              style={{
                padding: "10px 20px",
                background: "#6b7280",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              ביטול
            </button>

            <button
              type="button"
              onClick={switchCamera}
              style={{
                padding: "10px 15px",
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              החלף מצלמה
            </button>

            <button
              type="button"
              onClick={captureImage}
              style={{
                padding: "10px 20px",
                background: "#22c55e",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              צלם
            </button>
          </div>
        </div>
      )}

      {capturedImage && (
        <div style={{ marginTop: "10px" }}>
          <div style={{ position: "relative" }}>
            <img
              src={capturedImage}
              alt="תמונה שצולמה"
              style={{
                width: "100%",
                maxHeight: "200px",
                objectFit: "contain",
                borderRadius: "8px",
              }}
            />
            <button
              type="button"
              onClick={() => setCapturedImage(null)}
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(239, 68, 68, 0.8)",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
          <p style={{ color: "green", marginTop: "8px" }}>
            התמונה צולמה בהצלחה!
          </p>
        </div>
      )}
    </div>
  );
};

export default function AddTransaction() {
  const [type, setType] = useState("income");
  const [form, setForm] = useState({
    amount: "",
    invoiceNumber: "",
    businessName: "",
    date: "",
    file: null,
  });
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setForm({ ...form, file });

    // יצירת תצוגה מקדימה
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      // לא תמונה, מציג אייקון PDF
      setPreviewImage(null);
    }
  };

  // טיפול בתמונה מהמצלמה
  const handleImageCapture = (file) => {
    setForm({ ...form, file });

    // יצירת תצוגה מקדימה
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);

    // ניקוי שדה הקובץ אם היה
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let documentUrl = null;

      if (form.file) {
        const fileExt = form.file.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("documents")
          .upload(fileName, form.file);

        if (uploadError) throw uploadError;

        const { data: urlData } = await supabase.storage
          .from("documents")
          .getPublicUrl(fileName);

        documentUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("transactions").insert([
        {
          type,
          amount: Number(form.amount),
          invoice_number: form.invoiceNumber,
          business_name: form.businessName,
          date: form.date,
          document_url: documentUrl,
        },
      ]);

      if (error) throw error;

      setSuccess(true);
      setPreviewImage(null);
      console.log("🚀 העסקה נשלחה בהצלחה:", form);

      // איפוס הטופס
      setForm({
        amount: "",
        invoiceNumber: "",
        businessName: "",
        date: "",
        file: null,
      });
      setType("income");
      if (fileInputRef.current) fileInputRef.current.value = null;

      // הסתרת הודעת הצלחה אחרי 3 שניות
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("❌ שגיאה בשליחה:", err.message);
      alert(`שגיאה: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "1rem", direction: "rtl" }}>
      <h2
        style={{ marginBottom: "1rem", fontSize: "1.5rem", fontWeight: "bold" }}
      >
        הוספת עסקה חדשה
      </h2>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          maxWidth: "400px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              borderRadius: "0.5rem",
              overflow: "hidden",
              border: "1px solid #e5e7eb",
            }}
          >
            <button
              type="button"
              onClick={() => setType("income")}
              style={{
                padding: "0.5rem 1rem",
                background: type === "income" ? "#3b82f6" : "#f3f4f6",
                color: type === "income" ? "white" : "#374151",
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              הכנסה
            </button>
            <button
              type="button"
              onClick={() => setType("expense")}
              style={{
                padding: "0.5rem 1rem",
                background: type === "expense" ? "#ef4444" : "#f3f4f6",
                color: type === "expense" ? "white" : "#374151",
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              הוצאה
            </button>
          </div>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.25rem" }}>
            סכום:
          </label>
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #e5e7eb",
              borderRadius: "0.25rem",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.25rem" }}>
            מספר חשבונית:
          </label>
          <input
            type="text"
            name="invoiceNumber"
            value={form.invoiceNumber}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #e5e7eb",
              borderRadius: "0.25rem",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.25rem" }}>
            שם העסק:
          </label>
          <input
            type="text"
            name="businessName"
            value={form.businessName}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #e5e7eb",
              borderRadius: "0.25rem",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.25rem" }}>
            תאריך:
          </label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #e5e7eb",
              borderRadius: "0.25rem",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.25rem" }}>
            העלאת מסמך/תמונה:
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #e5e7eb",
              borderRadius: "0.25rem",
            }}
          />

          {/* תצוגה מקדימה לקובץ שנבחר */}
          {previewImage && (
            <div style={{ marginTop: "0.5rem", position: "relative" }}>
              <img
                src={previewImage}
                alt="תצוגה מקדימה"
                style={{
                  maxWidth: "100%",
                  maxHeight: "200px",
                  objectFit: "contain",
                  borderRadius: "0.25rem",
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setPreviewImage(null);
                  setForm({ ...form, file: null });
                  if (fileInputRef.current) fileInputRef.current.value = null;
                }}
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(239, 68, 68, 0.8)",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* קומפוננט מצלמה משופר */}
          <CameraUpload onImageCapture={handleImageCapture} />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.75rem",
            background: loading ? "#94a3b8" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "0.25rem",
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: "1rem",
          }}
        >
          {loading ? "שולח..." : "שמור עסקה"}
        </button>
      </form>

      {success && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.75rem",
            background: "#dcfce7",
            color: "#166534",
            borderRadius: "0.25rem",
          }}
        >
          ✅ העסקה נוספה בהצלחה!
        </div>
      )}
    </div>
  );
}
