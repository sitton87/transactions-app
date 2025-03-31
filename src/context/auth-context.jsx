import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

// יצירת קליינט של Supabase - החלף עם הפרטים שלך
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://grtnnimmwajobegjcwvk.supabase.co";
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdydG5uaW1td2Fqb2JlZ2pjd3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMjQzMTcsImV4cCI6MjA1ODkwMDMxN30.4RaJVVfXuL0X_yBsLzWQ64oIuLSta4UxWUm9DmD6KmI";
const supabase = createClient(supabaseUrl, supabaseKey);

// יצירת קונטקסט עבור האימות
const AuthContext = createContext();

// יצירת Provider עבור הקונטקסט
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // טעינת מצב האימות בעת טעינת האפליקציה
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        // בדיקת סשן קיים
        const { data: sessionData } = await supabase.auth.getSession();

        if (sessionData?.session) {
          const { data: userData } = await supabase.auth.getUser();

          if (userData?.user) {
            setUser(userData.user);

            // טעינת פרופיל המשתמש והרשאות
            const { data: profileData, error: profileError } = await supabase
              .from("user_profiles")
              .select(
                `
                *,
                roles(
                  id,
                  name,
                  permissions:role_permissions(
                    permissions(id, name)
                  )
                )
              `
              )
              .eq("id", userData.user.id)
              .single();

            if (profileError && profileError.code !== "PGRST116") {
              throw profileError;
            }

            if (profileData) {
              setUserProfile(profileData);

              // חילוץ הרשאות
              const permissions =
                profileData.roles?.permissions
                  ?.flatMap((rp) => rp.permissions || [])
                  ?.map((p) => p.name) || [];

              setUserPermissions(permissions);
            }
          }
        }
      } catch (error) {
        console.error("שגיאה בטעינת נתוני משתמש:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    // הרשמה לאירועי שינוי אימות
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          // משתמש התחבר - טעינת הנתונים שלו
          fetchUserData();
        } else if (event === "SIGNED_OUT") {
          // משתמש התנתק - איפוס הנתונים
          setUser(null);
          setUserProfile(null);
          setUserPermissions([]);
        }
      }
    );

    // טעינה ראשונית
    fetchUserData();

    // ניקוי מאזין בעת פירוק הקומפוננטה
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // פונקציית התחברות
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error("שגיאת התחברות:", error);
      setError(error.message);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // פונקציית הרשמה
  const signUp = async (email, password, userData = {}) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // אם ההרשמה הצליחה, נוסיף את פרטי המשתמש
      if (data.user) {
        // חיפוש תפקיד ברירת מחדל 'user'
        const { data: roleData } = await supabase
          .from("roles")
          .select("id")
          .eq("name", "user")
          .single();

        const roleId = roleData?.id;

        // יצירת פרופיל למשתמש
        const { error: profileError } = await supabase
          .from("user_profiles")
          .insert([
            {
              id: data.user.id,
              full_name: userData.fullName || "",
              role_id: roleId,
            },
          ]);

        if (profileError) throw profileError;
      }

      return { success: true, data };
    } catch (error) {
      console.error("שגיאת הרשמה:", error);
      setError(error.message);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // פונקציית התנתקות
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      // איפוס נתוני המשתמש בצד הלקוח
      setUser(null);
      setUserProfile(null);
      setUserPermissions([]);

      return { success: true };
    } catch (error) {
      console.error("שגיאת התנתקות:", error);
      setError(error.message);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // פונקציית איפוס סיסמה
  const resetPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("שגיאת איפוס סיסמה:", error);
      setError(error.message);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // פונקציית עדכון סיסמה
  const updatePassword = async (newPassword) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("שגיאת עדכון סיסמה:", error);
      setError(error.message);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // פונקציית בדיקת הרשאה
  const hasPermission = (permissionName) => {
    return userPermissions.includes(permissionName);
  };

  // פונקציית בדיקת תפקיד
  const hasRole = (roleName) => {
    return userProfile?.roles?.name === roleName;
  };

  // ערכי הקונטקסט
  const value = {
    user,
    userProfile,
    userPermissions,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    hasPermission,
    hasRole,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// הוק שמאפשר שימוש בקונטקסט בקלות
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth חייב להשתמש בתוך AuthProvider");
  }

  return context;
}

// רכיב מעטפת להגנה על דפים שדורשים אימות
export function ProtectedRoute({
  children,
  permissions = [],
  requiredRoles = [],
}) {
  const { isAuthenticated, hasPermission, hasRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return; // ממתין לסיום טעינת נתוני האימות

    // אם המשתמש לא מחובר, מעביר לדף הכניסה
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // בדיקת הרשאות נדרשות
    if (permissions.length > 0) {
      const hasAllPermissions = permissions.every((perm) =>
        hasPermission(perm)
      );

      if (!hasAllPermissions) {
        navigate("/unauthorized");
        return;
      }
    }

    // בדיקת תפקידים נדרשים
    if (requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some((role) => hasRole(role));

      if (!hasRequiredRole) {
        navigate("/unauthorized");
        return;
      }
    }
  }, [
    isAuthenticated,
    loading,
    permissions,
    requiredRoles,
    navigate,
    hasPermission,
    hasRole,
  ]);

  // מציג מסך טעינה בזמן בדיקת האימות
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <p>טוען...</p>
      </div>
    );
  }

  // אם לא מחובר, לא מציג כלום (הניתוב יתבצע ב-useEffect)
  if (!isAuthenticated) {
    return null;
  }

  // אם יש הרשאות נדרשות ואין למשתמש את כולן, לא מציג כלום
  if (
    permissions.length > 0 &&
    !permissions.every((perm) => hasPermission(perm))
  ) {
    return null;
  }

  // אם יש תפקידים נדרשים ואין למשתמש אף אחד מהם, לא מציג כלום
  if (
    requiredRoles.length > 0 &&
    !requiredRoles.some((role) => hasRole(role))
  ) {
    return null;
  }

  // אם הכל תקין, מציג את תוכן הדף
  return children;
}

export default AuthContext;
