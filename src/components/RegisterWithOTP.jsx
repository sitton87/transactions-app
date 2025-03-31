// src/components/RegisterWithOTP.jsx
import React, { useState } from "react";
import { registerWithOTP, completeRegistration } from "../lib/authUtils";

const RegisterWithOTP = () => {
  // מצבי טופס שונים
  const [formState, setFormState] = useState("register"); // "register", "verifyOTP"

  // שדות טופס
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");

  // מצבי תצוגה
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // אתחול הודעות
  const resetMessages = () => {
    setMessage("");
    setError("");
  };

  // טיפול ברישום ושליחת OTP
  const handleRegister = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      // בדיקה שהסיסמאות תואמות
      if (password !== confirmPassword) {
        throw new Error("הסיסמאות אינן תואמות");
      }

      // הרשמה ושליחת OTP
      const result = await registerWithOTP(email, password);

      if (!result.success) {
        throw new Error(result.error);
      }

      // בסביבת פיתוח, להקלה על התהליך
      console.log("OTP Code (for development):", result.otp);

      // מעבר לשלב האימות
      setMessage('קוד אימות נשלח לכתובת הדוא"ל שלך');
      setFormState("verifyOTP");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // טיפול באימות OTP וסיום הרשמה
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      // השלמת ההרשמה
      const result = await completeRegistration(email, password, otp);

      if (!result.success) {
        throw new Error(result.error);
      }

      setMessage("ההרשמה הושלמה בהצלחה! אנא התחבר עם הפרטים שלך");

      // ניתן להוסיף כאן ניתוב לדף ההתחברות
      // או להפעיל callback שהועבר מהקומפוננטה ההורה

      // איפוס הטופס
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setOtp("");
      setFormState("register");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // טיפול בבקשת קוד OTP חדש
  const handleResendOTP = async () => {
    resetMessages();
    setLoading(true);

    try {
      const result = await registerWithOTP(email, password);

      if (!result.success) {
        throw new Error(result.error);
      }

      // בסביבת פיתוח, להקלה על התהליך
      console.log("New OTP Code (for development):", result.otp);

      setMessage('קוד אימות חדש נשלח לכתובת הדוא"ל שלך');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // רינדור טופס הרשמה
  const renderRegisterForm = () => (
    <form onSubmit={handleRegister} className="auth-form">
      <div className="form-group">
        <label htmlFor="email">כתובת דוא״ל:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-control"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">סיסמה:</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-control"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">אימות סיסמה:</label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="form-control"
          required
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "מתבצע רישום..." : "הירשם"}
      </button>
    </form>
  );

  // רינדור טופס אימות OTP
  const renderVerifyOTPForm = () => (
    <form onSubmit={handleVerifyOTP} className="auth-form">
      <div className="otp-info">
        <p>
          קוד אימות נשלח לכתובת הדוא"ל <strong>{email}</strong>.
        </p>
        <p>אנא הזן את הקוד בן 6 הספרות שקיבלת:</p>
      </div>

      <div className="form-group">
        <label htmlFor="otp">קוד אימות:</label>
        <input
          type="text"
          id="otp"
          value={otp}
          onChange={(e) =>
            setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          placeholder="123456"
          className="form-control otp-input"
          maxLength={6}
          pattern="\d{6}"
          required
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={loading || otp.length !== 6}
      >
        {loading ? "מאמת..." : "אמת קוד"}
      </button>

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-link"
          onClick={handleResendOTP}
          disabled={loading}
        >
          שלח קוד חדש
        </button>
        <button
          type="button"
          className="btn btn-link"
          onClick={() => setFormState("register")}
          disabled={loading}
        >
          חזרה
        </button>
      </div>
    </form>
  );

  return (
    <div className="auth-container" dir="rtl">
      <h2>{formState === "register" ? "הרשמה למערכת" : "אימות קוד"}</h2>

      {/* הודעות */}
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* הטפסים */}
      {formState === "register" ? renderRegisterForm() : renderVerifyOTPForm()}
    </div>
  );
};

export default RegisterWithOTP;
