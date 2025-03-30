import { supabase } from "../lib/supabaseClient";
import React, { useState, useRef, useEffect } from "react";

// קומפוננט מצלמה משופר
const CameraUpload = ({ onImageCapture }) => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const containerRef = useRef(null);

  // פתיחת המצלמה - עם הגדרה מפורשת למצלמה האחורית
  const openCamera = async () => {
    try {
      // ניסיון ספציפי למצלמה האחורית
      const stream = await navigator.mediaDevices
        .getUserMedia({
          video: {
            facingMode: { exact: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        })
        .catch(async () => {
          // אם אין מצלמה אחורית, ננסה כל מצלמה זמינה
          console.log("אין גישה למצלמה האחורית, מנסה מצלמה אחרת");
          return await navigator.mediaDevices.getUserMedia({
            video: true,
          });
        });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // חיכוי קצר לטעינת המצלמה לפני הפעלה
        setTimeout(() => {
          videoRef.current
            .play()
            .catch((e) => console.error("שגיאה בהפעלת וידאו:", e));
        }, 300);
      }

      setShowCamera(true);
    } catch (error) {
      console.error("שגיאה בגישה למצלמה:", error);
      alert("לא ניתן לגשת למצלמה. אנא בדוק את ההרשאות או נסה במכשיר אחר.");
    }
  };

  // סגירת המצלמה
  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setShowCamera(false);
  };

  // צילום תמונה
  const captureImage = () => {
    if (!videoRef.current) return;

    try {
      const video = videoRef.current;

      // יצירת קנבס בגודל מלא של הוידאו
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");

      // ציור התמונה על הקנבס
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // המרה ל-base64 לתצוגה מקדימה
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);

      // המרה לקובץ
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error("שגיאה ביצירת קובץ תמונה");
            return;
          }

          // יצירת קובץ עם שם ותאריך
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
          setCapturedImage(imageDataUrl);
          if (onImageCapture) {
            onImageCapture(file);
          }

          // סגירת המצלמה
          closeCamera();
        },
        "image/jpeg",
        0.9
      );
    } catch (err) {
      console.error("שגיאה בצילום התמונה:", err);
      alert("אירעה שגיאה בצילום התמונה. נסה שנית.");
    }
  };

  // ניקוי משאבים כשהקומפוננט מתפרק
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

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
          ref={containerRef}
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

            <video
              ref={videoRef}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
              autoPlay
              playsInline
              muted
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              padding: "16px",
              backgroundColor: "#000",
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
