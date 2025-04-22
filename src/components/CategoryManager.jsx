import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// התחברות ל-Supabase
const supabaseUrl = "https://grtnnimmwajobegjcwvk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const supabase = createClient(supabaseUrl, supabaseKey);

function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // טעינת המשתמש וקטגוריות בהתחלה
  useEffect(() => {
    const fetchUserAndCategories = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await fetchCategories(user.id);
      }
    };

    fetchUserAndCategories();
  }, []);

  // שליפת קטגוריות מה-DB
  const fetchCategories = async (userId) => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("שגיאה בטעינת קטגוריות");
      console.error(error);
    } else {
      setCategories(data);
    }
  };

  // הוספת קטגוריה חדשה
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    setLoading(true);
    const { data, error } = await supabase.from("categories").insert([
      {
        name: newCategory,
        user_id: userId,
      },
    ]);

    if (error) {
      setMessage("שגיאה בהוספה");
      console.error(error);
    } else {
      setNewCategory("");
      await fetchCategories(userId);
    }
    setLoading(false);
  };

  // מחיקת קטגוריה לפי ID
  const handleDeleteCategory = async (id) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      setMessage("שגיאה במחיקה");
      console.error(error);
    } else {
      await fetchCategories(userId);
    }
  };

  return (
    <div style={{ marginTop: "2rem", direction: "rtl" }}>
      <h3>ניהול קטגוריות</h3>
      <div style={{ display: "flex", gap: "10px", marginBottom: "1rem" }}>
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="שם קטגוריה חדשה"
          style={{ flexGrow: 1, padding: "8px" }}
        />
        <button onClick={handleAddCategory} disabled={loading}>
          {loading ? "מוסיף..." : "הוסף"}
        </button>
      </div>

      {message && (
        <div style={{ color: "red", marginBottom: "10px" }}>{message}</div>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {categories.map((cat) => (
          <li
            key={cat.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px",
              borderBottom: "1px solid #ccc",
            }}
          >
            {cat.name}
            <button
              onClick={() => handleDeleteCategory(cat.id)}
              style={{
                backgroundColor: "#ff6b6b",
                border: "none",
                color: "white",
                padding: "5px 10px",
                borderRadius: "4px",
              }}
            >
              מחק
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CategoryManager;
