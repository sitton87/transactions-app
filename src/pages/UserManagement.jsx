import React, { useState, useEffect } from "react";
import { useAuth } from "../context/auth-context";
import { createClient } from "@supabase/supabase-js";

// יצירת קליינט של Supabase - החלף עם הפרטים שלך
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://grtnnimmwajobegjcwvk.supabase.co";
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdydG5uaW1td2Fqb2JlZ2pjd3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMjQzMTcsImV4cCI6MjA1ODkwMDMxN30.4RaJVVfXuL0X_yBsLzWQ64oIuLSta4UxWUm9DmD6KmI";
const supabase = createClient(supabaseUrl, supabaseKey);

function UserManagement() {
  const { user, hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role_id: "",
  });

  // טעינת משתמשים ותפקידים
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // בדיקה שהמשתמש הנוכחי יש לו הרשאה לניהול משתמשים
        if (!hasPermission("users:manage")) {
          throw new Error("אין לך הרשאה לניהול משתמשים");
        }

        // טעינת כל המשתמשים
        const { data: usersData, error: usersError } = await supabase.from(
          "user_profiles"
        ).select(`
            *,
            roles(id, name)
          `);

        if (usersError) throw usersError;

        // טעינת תפקידים
        const { data: rolesData, error: rolesError } = await supabase
          .from("roles")
          .select("*");

        if (rolesError) throw rolesError;

        setUsers(usersData || []);
        setRoles(rolesData || []);
      } catch (error) {
        console.error("שגיאה בטעינת נתונים:", error);
        setError(error.message || "שגיאה בטעינת נתונים");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hasPermission]);

  // פתיחת חלון עריכת משתמש
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      full_name: user.full_name || "",
      email: "", // אי אפשר לערוך אימייל דרך הממשק הזה
      role_id: user.role_id || "",
    });
    setShowModal(true);
  };

  // פתיחת חלון להוספת משתמש חדש
  const handleAddUser = () => {
    setSelectedUser(null);
    setFormData({
      full_name: "",
      email: "",
      role_id:
        roles.length > 0
          ? roles.find((r) => r.name === "user")?.id || roles[0].id
          : "",
      password: "", // רק בהוספת משתמש חדש
    });
    setShowModal(true);
  };

  // שינוי ערכים בטופס
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // שמירת משתמש (הוספה או עדכון)
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (selectedUser) {
        // עדכון משתמש קיים
        const { error } = await supabase
          .from("user_profiles")
          .update({
            full_name: formData.full_name,
            role_id: formData.role_id,
            updated_at: new Date(),
          })
          .eq("id", selectedUser.id);

        if (error) throw error;
      } else {
        // הוספת משתמש חדש
        // 1. יצירת משתמש חדש במערכת האימות
        const { data: authData, error: authError } =
          await supabase.auth.admin.createUser({
            email: formData.email,
            password: formData.password,
            email_confirm: true, // אישור האימייל אוטומטית
          });

        if (authError) throw authError;

        // 2. יצירת פרופיל למשתמש
        if (authData?.user) {
          const { error: profileError } = await supabase
            .from("user_profiles")
            .insert([
              {
                id: authData.user.id,
                full_name: formData.full_name,
                role_id: formData.role_id,
              },
            ]);

          if (profileError) throw profileError;
        }
      }

      // רענון רשימת המשתמשים
      const { data: refreshedUsers, error: refreshError } = await supabase.from(
        "user_profiles"
      ).select(`
          *,
          roles(id, name)
        `);

      if (!refreshError) {
        setUsers(refreshedUsers || []);
      }

      // סגירת המודל
      setShowModal(false);
    } catch (error) {
      console.error("שגיאה בשמירת משתמש:", error);
      setError(error.message || "שגיאה בשמירת משתמש");
    } finally {
      setLoading(false);
    }
  };

  // מחיקת משתמש
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("האם אתה בטוח שברצונך למחוק משתמש זה?")) return;

    try {
      setLoading(true);

      // 1. מחיקת המשתמש ממערכת האימות (יסיר גם את הפרופיל בגלל מחיקה מקושרת)
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) throw error;

      // 2. עדכון רשימת המשתמשים
      setUsers(users.filter((user) => user.id !== userId));
    } catch (error) {
      console.error("שגיאה במחיקת משתמש:", error);
      setError(error.message || "שגיאה במחיקת משתמש");
    } finally {
      setLoading(false);
    }
  };

  // איפוס הסיסמה למשתמש
  const handleResetPassword = async (email) => {
    if (!email) {
      setError("אימייל המשתמש אינו זמין");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      alert(`הוראות לאיפוס סיסמה נשלחו לכתובת: ${email}`);
    } catch (error) {
      console.error("שגיאה באיפוס סיסמה:", error);
      setError(error.message || "שגיאה באיפוס סיסמה");
    } finally {
      setLoading(false);
    }
  };

  // עיצוב המודל
  const modalStyle = {
    display: showModal ? "block" : "none",
    position: "fixed",
    zIndex: 1000,
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    overflow: "auto",
    backgroundColor: "rgba(0,0,0,0.4)",
  };

  const modalContentStyle = {
    backgroundColor: "white",
    margin: "10% auto",
    padding: "20px",
    border: "1px solid #888",
    width: "80%",
    maxWidth: "500px",
    borderRadius: "8px",
    direction: "rtl",
  };

  // בדיקת הרשאות
  if (!user || !hasPermission("users:manage")) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>גישה נדחתה</h2>
        <p>אין לך הרשאות לצפייה בדף זה.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", direction: "rtl" }}>
      <h2>ניהול משתמשים</h2>
      <p>כאן ניתן לנהל את המשתמשים במערכת, להגדיר תפקידים והרשאות.</p>

      {/* הצגת שגיאות */}
      {error && (
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#fee2e2",
            color: "#b91c1c",
            borderRadius: "8px",
            marginBottom: "1rem",
          }}
        >
          <p>{error}</p>
        </div>
      )}

      {/* כפתור הוספת משתמש */}
      <div style={{ marginBottom: "1.5rem" }}>
        <button
          onClick={handleAddUser}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#3f51b5",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          הוסף משתמש חדש
        </button>
      </div>

      {/* טבלת משתמשים */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p>טוען נתונים...</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#3f51b5", color: "white" }}>
                <th style={{ padding: "0.75rem", textAlign: "right" }}>שם</th>
                <th style={{ padding: "0.75rem", textAlign: "right" }}>
                  תפקיד
                </th>
                <th style={{ padding: "0.75rem", textAlign: "right" }}>
                  תאריך יצירה
                </th>
                <th style={{ padding: "0.75rem", textAlign: "right" }}>
                  תאריך עדכון
                </th>
                <th style={{ padding: "0.75rem", textAlign: "center" }}>
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid #ddd" }}>
                    <td style={{ padding: "0.75rem" }}>
                      {user.full_name || "—"}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      {user.roles?.name || "—"}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      {new Date(user.created_at).toLocaleDateString("he-IL")}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      {new Date(user.updated_at).toLocaleDateString("he-IL")}
                    </td>
                    <td style={{ padding: "0.75rem", textAlign: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <button
                          onClick={() => handleEditUser(user)}
                          style={{
                            padding: "0.3rem 0.6rem",
                            backgroundColor: "#4f46e5",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "0.875rem",
                          }}
                        >
                          ערוך
                        </button>
                        <button
                          onClick={() => handleResetPassword(user.email)}
                          style={{
                            padding: "0.3rem 0.6rem",
                            backgroundColor: "#f59e0b",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "0.875rem",
                          }}
                        >
                          איפוס סיסמה
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          style={{
                            padding: "0.3rem 0.6rem",
                            backgroundColor: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "0.875rem",
                          }}
                        >
                          מחק
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    style={{ padding: "1.5rem", textAlign: "center" }}
                  >
                    לא נמצאו משתמשים
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* מודל עריכת/הוספת משתמש */}
      <div style={modalStyle}>
        <div style={modalContentStyle}>
          <h3>{selectedUser ? "עריכת משתמש" : "הוספת משתמש חדש"}</h3>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1rem" }}>
              <label
                htmlFor="full_name"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "500",
                }}
              >
                שם מלא
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={formData.full_name}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  border: "1px solid #d1d5db",
                }}
                required
              />
            </div>

            {!selectedUser && (
              <>
                <div style={{ marginBottom: "1rem" }}>
                  <label
                    htmlFor="email"
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: "500",
                    }}
                  >
                    אימייל
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "4px",
                      border: "1px solid #d1d5db",
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label
                    htmlFor="password"
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: "500",
                    }}
                  >
                    סיסמה
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "4px",
                      border: "1px solid #d1d5db",
                    }}
                    required
                  />
                </div>
              </>
            )}

            <div style={{ marginBottom: "1.5rem" }}>
              <label
                htmlFor="role_id"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "500",
                }}
              >
                תפקיד
              </label>
              <select
                id="role_id"
                name="role_id"
                value={formData.role_id}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  border: "1px solid #d1d5db",
                }}
                required
              >
                <option value="">בחר תפקיד</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name} - {role.description}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: "0.5rem",
                  backgroundColor: "#e5e7eb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                ביטול
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "0.5rem",
                  backgroundColor: "#3f51b5",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "שומר..." : "שמור"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UserManagement;
