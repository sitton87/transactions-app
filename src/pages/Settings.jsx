import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// יצירת לקוח Supabase
// החלף את האינפורמציה בזו שקיבלת מ-Supabase
const supabaseUrl = "https://grtnnimmwajobegjcwvk.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdydG5uaW1td2Fqb2JlZ2pjd3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMjQzMTcsImV4cCI6MjA1ODkwMDMxN30.4RaJVVfXuL0X_yBsLzWQ64oIuLSta4UxWUm9DmD6KmI";
const supabase = createClient(supabaseUrl, supabaseKey);

function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // בדיקה האם המשתמש מחובר
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setEmail(user.email || "");
      }
    };

    getUser();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // בדיקה שהסיסמאות תואמות
      if (newPassword !== confirmPassword) {
        setMessage("הסיסמאות אינן תואמות");
        setLoading(false);
        return;
      }

      // עדכון הסיסמה ב-Supabase
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      // איפוס השדות והצגת הודעת הצלחה
      setMessage("הסיסמה הוחלפה בהצלחה");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setMessage(`שגיאה בהחלפת הסיסמה: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // שליחת מייל לאיפוס סיסמה
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      setMessage("הוראות לאיפוס סיסמה נשלחו לדוא״ל שלך");
    } catch (error) {
      setMessage(`שגיאה בשליחת הוראות לאיפוס סיסמה: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", direction: "rtl" }}>
      <h2>הגדרות</h2>

      {message && (
        <div
          style={{
            padding: "10px",
            margin: "15px 0",
            backgroundColor: message.includes("שגיאה") ? "#fff0f0" : "#f0f8ff",
            border: `1px solid ${
              message.includes("שגיאה") ? "#ff6b6b" : "#4682b4"
            }`,
            borderRadius: "4px",
          }}
        >
          {message}
        </div>
      )}

      <div style={{ marginTop: "2rem" }}>
        <h3>החלפת סיסמה</h3>
        <form onSubmit={handleChangePassword}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              סיסמה חדשה:
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
              required
            />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              אימות סיסמה חדשה:
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: loading ? "#cccccc" : "#4682b4",
              color: "white",
              padding: "10px 15px",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "מעבד..." : "החלף סיסמה"}
          </button>
        </form>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3>איפוס סיסמה</h3>
        <form onSubmit={handleResetPassword}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              כתובת דוא״ל:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: loading ? "#cccccc" : "#4682b4",
              color: "white",
              padding: "10px 15px",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "שולח..." : "שלח הוראות איפוס"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SettingsPage;
