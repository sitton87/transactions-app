import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [mode, setMode] = useState("login"); // login או register
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword } = useAuth();

  // פונקציה לכניסה למערכת
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const result = await signIn(email, password);

      if (!result.success)
        throw new Error(result.error?.message || "שגיאה בהתחברות");

      // הודעת הצלחה והפניה לדף הראשי
      setSuccessMessage("התחברת בהצלחה! מעביר אותך לדף הראשי...");

      // הפניה לדף הראשי לאחר כניסה מוצלחת
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      setError(error.message || "שגיאה בהתחברות. נסה שוב.");
      console.error("שגיאת התחברות:", error);
    } finally {
      setLoading(false);
    }
  };

  // פונקציה להרשמה למערכת
  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const result = await signUp(email, password, {
        fullName: "", // אפשר להוסיף שדה לטופס ההרשמה
      });

      if (!result.success)
        throw new Error(result.error?.message || "שגיאה בהרשמה");

      setSuccessMessage("נרשמת בהצלחה! אנא אמת את כתובת האימייל שלך.");

      // החלפה בחזרה למצב כניסה
      setTimeout(() => {
        setMode("login");
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      setError(error.message || "שגיאה בהרשמה. נסה שוב.");
      console.error("שגיאת הרשמה:", error);
    } finally {
      setLoading(false);
    }
  };

  // פונקציה לאיפוס סיסמה
  const handleForgotPassword = async () => {
    if (!email) {
      setError("יש להזין כתובת אימייל לשחזור הסיסמה");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await resetPassword(email);

      if (!result.success)
        throw new Error(result.error?.message || "שגיאה באיפוס סיסמה");

      setSuccessMessage("הוראות לאיפוס סיסמה נשלחו לכתובת האימייל שלך.");
    } catch (error) {
      setError(error.message || "שגיאה בשליחת בקשת איפוס סיסמה. נסה שוב.");
      console.error("שגיאת איפוס סיסמה:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        direction: "rtl",
      }}
    >
      <div
        style={{
          width: "400px",
          padding: "2rem",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: "1.5rem",
            color: "#3f51b5",
          }}
        >
          {mode === "login" ? "התחברות למערכת" : "הרשמה למערכת"}
        </h2>

        {error && (
          <div
            style={{
              padding: "0.75rem",
              marginBottom: "1rem",
              backgroundColor: "#fee2e2",
              borderRadius: "4px",
              color: "#b91c1c",
            }}
          >
            {error}
          </div>
        )}

        {successMessage && (
          <div
            style={{
              padding: "0.75rem",
              marginBottom: "1rem",
              backgroundColor: "#ecfdf5",
              borderRadius: "4px",
              color: "#047857",
            }}
          >
            {successMessage}
          </div>
        )}

        <form onSubmit={mode === "login" ? handleLogin : handleRegister}>
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
                color: "#374151",
              }}
            >
              כתובת אימייל
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "4px",
                border: "1px solid #d1d5db",
                outline: "none",
                fontSize: "1rem",
              }}
              placeholder="your@email.com"
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
                color: "#374151",
              }}
            >
              סיסמה
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "4px",
                border: "1px solid #d1d5db",
                outline: "none",
                fontSize: "1rem",
              }}
              placeholder="********"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.75rem",
              backgroundColor: "#3f51b5",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "1rem",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? "0.7" : "1",
              marginBottom: "1rem",
            }}
          >
            {loading ? "מעבד..." : mode === "login" ? "התחבר" : "הירשם"}
          </button>

          {mode === "login" && (
            <div
              style={{
                textAlign: "center",
                marginBottom: "1rem",
              }}
            >
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                style={{
                  background: "none",
                  border: "none",
                  color: "#3f51b5",
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontSize: "0.875rem",
                }}
              >
                שכחתי סיסמה
              </button>
            </div>
          )}

          <div
            style={{
              textAlign: "center",
              fontSize: "0.875rem",
              color: "#6b7280",
            }}
          >
            {mode === "login" ? "אין לך חשבון? " : "כבר יש לך חשבון? "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError(null);
                setSuccessMessage(null);
              }}
              style={{
                background: "none",
                border: "none",
                color: "#3f51b5",
                cursor: "pointer",
                textDecoration: "underline",
                fontSize: "0.875rem",
              }}
            >
              {mode === "login" ? "הירשם עכשיו" : "התחבר"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
