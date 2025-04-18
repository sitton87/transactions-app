import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // טוען את הסשן מהקישור (access_token מה-URL)
    supabase.auth.getSessionFromUrl().then(({ data, error }) => {
      if (error) {
        setMessage("שגיאה בקישור. אולי פג תוקף?");
        console.error(error.message);
      }
      setLoading(false);
    });
  }, []);

  const handleReset = async () => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setMessage("שגיאה באיפוס הסיסמה.");
      console.error(error.message);
    } else {
      setMessage("✅ הסיסמה עודכנה בהצלחה! אפשר לחזור להתחברות.");
    }
  };

  if (loading) return <p style={{ textAlign: "center" }}>טוען...</p>;

  return (
    <div style={{ maxWidth: "400px", margin: "2rem auto", padding: "1rem" }}>
      <h2 style={{ textAlign: "center" }}>איפוס סיסמה</h2>
      <input
        type="password"
        placeholder="סיסמה חדשה"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
      />
      <button
        onClick={handleReset}
        style={{
          width: "100%",
          padding: "0.75rem",
          backgroundColor: "#3f51b5",
          color: "white",
          border: "none",
          borderRadius: "4px",
        }}
      >
        אפס סיסמה
      </button>
      {message && (
        <p style={{ marginTop: "1rem", textAlign: "center" }}>{message}</p>
      )}
    </div>
  );
}
