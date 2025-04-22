import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// יצירת קליינט של Supabase - החלף עם הפרטים שלך
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://grtnnimmwajobegjcwvk.supabase.co";
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdydG5uaW1td2Fqb2JlZ2pjd3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMjQzMTcsImV4cCI6MjA1ODkwMDMxN30.4RaJVVfXuL0X_yBsLzWQ64oIuLSta4UxWUm9DmD6KmI";
const supabase = createClient(supabaseUrl, supabaseKey);

function Transactions() {
  // סטייט לנתונים
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // סטייט לאפשרויות סינון
  const [businessTypeFilter, setBusinessTypeFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [businessFilter, setBusinessFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState(""); // הכנסה או הוצאה
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subcategoryFilter, setSubcategoryFilter] = useState("");

  // סטייט לאפשרויות בסלקטים
  const [businesses, setBusinesses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  // טעינת הנתונים מ-Supabase
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("transactions")
          .select(
            `
            id,
            date,
            type,
            amount,
            invoice_number,
            document_url,
            business_type,
            suppliers(name),
            categories(name),
            subcategories(name),
            payment_methods(name),
            source_types(name),
            source_codes(code)
          `
          )

          .order("date", { ascending: false });

        if (error) {
          throw error;
        }

        // הכנת אפשרויות סינון מהנתונים
        // עיבוד הנתונים שהגיעו מהשרת
        if (data && data.length > 0) {
          // המרת מבנה הנתונים למבנה שטוח יותר עבור השימוש בקומפוננטה
          const formattedData = data.map((item) => ({
            id: item.id,
            date: item.date,
            // המרת סוג העסקה מאנגלית לעברית
            type:
              item.type === "income"
                ? "הכנסה"
                : item.type === "expense"
                ? "הוצאה"
                : item.type,
            amount: item.amount,
            invoice_number: item.invoice_number,
            document_url: item.document_url,
            // שליפת הערכים מטבלאות קשורות
            business_type: item.business_type || "",
            business: item.suppliers?.name || "",
            category: item.categories?.name || "",
            subcategory: item.subcategories?.name || "",
            payment_method: item.payment_methods?.name || "",
            source_type: item.source_types?.name || "",
            source_code: item.source_codes?.code || "",
            description: item.invoice_number || "", // אם אין שדה תיאור נשתמש במספר חשבונית כתיאור
          }));

          setTransactions(formattedData);

          // עסקים ייחודיים
          const uniqueBusinesses = [
            ...new Set(
              formattedData.map((item) => item.business).filter(Boolean)
            ),
          ];
          setBusinesses(uniqueBusinesses.sort());

          // קטגוריות ייחודיות
          const uniqueCategories = [
            ...new Set(
              formattedData.map((item) => item.category).filter(Boolean)
            ),
          ];
          setCategories(uniqueCategories.sort());

          // תת-קטגוריות ייחודיות
          const uniqueSubcategories = [
            ...new Set(
              formattedData.map((item) => item.subcategory).filter(Boolean)
            ),
          ];
          setSubcategories(uniqueSubcategories.sort());
        } else {
          setTransactions([]);
        }
      } catch (error) {
        console.error("שגיאה בטעינת העסקאות:", error);
        setError("לא ניתן לטעון את העסקאות. נסה שוב מאוחר יותר.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // עדכון אפשרויות תת-קטגוריה כאשר משתנה הקטגוריה
  useEffect(() => {
    if (categoryFilter && transactions.length > 0) {
      const filteredSubcategories = [
        ...new Set(
          transactions
            .filter((t) => t.category === categoryFilter)
            .map((t) => t.subcategory)
            .filter(Boolean)
        ),
      ];
      setSubcategories(filteredSubcategories.sort());
      // מאפס את התת-קטגוריה אם היא לא רלוונטית לקטגוריה החדשה שנבחרה
      if (
        subcategoryFilter &&
        !filteredSubcategories.includes(subcategoryFilter)
      ) {
        setSubcategoryFilter("");
      }
    } else if (!categoryFilter && transactions.length > 0) {
      // אם אין סינון קטגוריה, מציג את כל תת-הקטגוריות
      const allSubcategories = [
        ...new Set(transactions.map((t) => t.subcategory).filter(Boolean)),
      ];
      setSubcategories(allSubcategories.sort());
    }
  }, [categoryFilter, transactions]);

  // סינון העסקאות לפי הפילטרים שנבחרו
  const filteredTransactions = transactions.filter((transaction) => {
    // סינון לפי תאריך התחלה
    if (startDate && transaction.date < startDate) {
      return false;
    }

    if (
      businessTypeFilter &&
      transaction.business_type !== businessTypeFilter
    ) {
      return false;
    }

    // סינון לפי תאריך סיום
    if (endDate && transaction.date > endDate) {
      return false;
    }

    // סינון לפי עסק
    if (businessFilter && transaction.business !== businessFilter) {
      return false;
    }

    // סינון לפי סוג (הכנסה/הוצאה)
    if (typeFilter && transaction.type !== typeFilter) {
      return false;
    }

    // סינון לפי קטגוריה
    if (categoryFilter && transaction.category !== categoryFilter) {
      return false;
    }

    // סינון לפי תת-קטגוריה
    if (subcategoryFilter && transaction.subcategory !== subcategoryFilter) {
      return false;
    }

    return true;
  });

  // חישוב סכומים כוללים
  const calculateTotals = () => {
    const income = filteredTransactions
      .filter((t) => t.type === "הכנסה")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const expense = filteredTransactions
      .filter((t) => t.type === "הוצאה")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    return {
      income,
      expense,
      balance: income - expense,
    };
  };

  const totals = calculateTotals();

  // פונקציה להצגת תאריך בפורמט נוח
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("he-IL");
    } catch (error) {
      return dateString;
    }
  };

  // פונקציה לאיפוס כל הפילטרים
  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setBusinessFilter("");
    setTypeFilter("");
    setCategoryFilter("");
    setSubcategoryFilter("");
  };

  return (
    <div style={{ padding: "2rem", direction: "rtl" }}>
      <h2>רשימת עסקאות</h2>
      <p>כאן תוכל לראות את כל העסקאות שנרשמו במערכת ולסנן אותן לפי צרכיך.</p>

      {/* תצוגת טעינה או שגיאה */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p>טוען עסקאות...</p>
        </div>
      ) : error ? (
        <div
          style={{
            textAlign: "center",
            padding: "2rem",
            color: "red",
            backgroundColor: "#ffeeee",
            borderRadius: "8px",
          }}
        >
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* אזור הפילטרים */}
          <div
            style={{
              margin: "1.5rem 0",
              padding: "1.5rem",
              backgroundColor: "#f5f5f5",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>סינון עסקאות</h3>
            <div style={{ flex: "1 1 200px" }}>
              <label
                htmlFor="business-type-filter"
                style={{ display: "block", marginBottom: "0.5rem" }}
              >
                סוג עסק:
              </label>
              <select
                id="business-type-filter"
                value={businessTypeFilter}
                onChange={(e) => setBusinessTypeFilter(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              >
                <option value="">הכל</option>
                <option value="חוות מתניה">חוות מתניה</option>
                <option value="בית תמחוי">בית תמחוי</option>
              </select>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              {/* סינון לפי טווח תאריכים */}
              <div style={{ flex: "1 1 200px" }}>
                <label
                  htmlFor="start-date"
                  style={{ display: "block", marginBottom: "0.5rem" }}
                >
                  מתאריך:
                </label>
                <input
                  type="date"
                  id="start-date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                />
              </div>

              <div style={{ flex: "1 1 200px" }}>
                <label
                  htmlFor="end-date"
                  style={{ display: "block", marginBottom: "0.5rem" }}
                >
                  עד תאריך:
                </label>
                <input
                  type="date"
                  id="end-date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                />
              </div>

              {/* סינון לפי עסק */}
              <div style={{ flex: "1 1 200px" }}>
                <label
                  htmlFor="business-filter"
                  style={{ display: "block", marginBottom: "0.5rem" }}
                >
                  עסק:
                </label>
                <select
                  id="business-filter"
                  value={businessFilter}
                  onChange={(e) => setBusinessFilter(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                >
                  <option value="">כל העסקים</option>
                  {businesses.map((business) => (
                    <option key={business} value={business}>
                      {business}
                    </option>
                  ))}
                </select>
              </div>

              {/* סינון לפי סוג (הכנסה/הוצאה) */}
              <div style={{ flex: "1 1 200px" }}>
                <label
                  htmlFor="type-filter"
                  style={{ display: "block", marginBottom: "0.5rem" }}
                >
                  סוג עסקה:
                </label>
                <select
                  id="type-filter"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                >
                  <option value="">הכל</option>
                  <option value="הכנסה">הכנסות</option>
                  <option value="הוצאה">הוצאות</option>
                </select>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              {/* סינון לפי קטגוריה */}
              <div style={{ flex: "1 1 200px" }}>
                <label
                  htmlFor="category-filter"
                  style={{ display: "block", marginBottom: "0.5rem" }}
                >
                  קטגוריה:
                </label>
                <select
                  id="category-filter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                >
                  <option value="">כל הקטגוריות</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* סינון לפי תת-קטגוריה */}
              <div style={{ flex: "1 1 200px" }}>
                <label
                  htmlFor="subcategory-filter"
                  style={{ display: "block", marginBottom: "0.5rem" }}
                >
                  תת-קטגוריה:
                </label>
                <select
                  id="subcategory-filter"
                  value={subcategoryFilter}
                  onChange={(e) => setSubcategoryFilter(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                  disabled={subcategories.length === 0}
                >
                  <option value="">כל תת-הקטגוריות</option>
                  {subcategories.map((subcategory) => (
                    <option key={subcategory} value={subcategory}>
                      {subcategory}
                    </option>
                  ))}
                </select>
              </div>

              {/* כפתור איפוס פילטרים */}
              <div
                style={{
                  flex: "1 1 200px",
                  display: "flex",
                  alignItems: "flex-end",
                }}
              >
                <button
                  onClick={resetFilters}
                  style={{
                    width: "100%",
                    padding: "0.5rem 1rem",
                    backgroundColor: "#e0e0e0",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  נקה פילטרים
                </button>
              </div>
            </div>
          </div>

          {/* אזור הסיכום */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              margin: "1rem 0",
              padding: "1rem",
              backgroundColor: "#f0f7ff",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                padding: "0.5rem",
                flex: "1 1 200px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.875rem", color: "#666" }}>
                סה"כ הכנסות
              </div>
              <div
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  color: "green",
                }}
              >
                ₪{totals.income.toLocaleString()}
              </div>
            </div>

            <div
              style={{
                padding: "0.5rem",
                flex: "1 1 200px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.875rem", color: "#666" }}>
                סה"כ הוצאות
              </div>
              <div
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  color: "red",
                }}
              >
                ₪{totals.expense.toLocaleString()}
              </div>
            </div>

            <div
              style={{
                padding: "0.5rem",
                flex: "1 1 200px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.875rem", color: "#666" }}>מאזן</div>
              <div
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  color: totals.balance >= 0 ? "green" : "red",
                }}
              >
                ₪{totals.balance.toLocaleString()}
              </div>
            </div>
          </div>

          {/* טבלת העסקאות */}
          <div style={{ overflowX: "auto", marginTop: "1.5rem" }}>
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
                <tr
                  style={{
                    backgroundColor: "#3f51b5",
                    color: "white",
                  }}
                >
                  <th style={{ padding: "0.75rem", textAlign: "right" }}>
                    תאריך
                  </th>
                  <th style={{ padding: "0.75rem", textAlign: "right" }}>
                    עסק
                  </th>
                  <th style={{ padding: "0.75rem", textAlign: "right" }}>
                    קטגוריה
                  </th>
                  <th style={{ padding: "0.75rem", textAlign: "right" }}>
                    תת-קטגוריה
                  </th>
                  <th style={{ padding: "0.75rem", textAlign: "right" }}>
                    תיאור
                  </th>
                  <th style={{ padding: "0.75rem", textAlign: "right" }}>
                    סוג
                  </th>
                  <th style={{ padding: "0.75rem", textAlign: "left" }}>
                    סכום
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction, index) => (
                    <tr
                      key={transaction.id || index}
                      style={{
                        borderBottom: "1px solid #ddd",
                        backgroundColor:
                          transaction.type === "הכנסה" ? "#f0fff4" : "#fff0f0",
                      }}
                    >
                      <td style={{ padding: "0.75rem" }}>
                        {formatDate(transaction.date)}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        {transaction.business}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        {transaction.category}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        {transaction.subcategory}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        {transaction.description}
                      </td>
                      <td
                        style={{
                          padding: "0.75rem",
                          color: transaction.type === "הכנסה" ? "green" : "red",
                        }}
                      >
                        {transaction.type}
                      </td>
                      <td
                        style={{
                          padding: "0.75rem",
                          textAlign: "left",
                          color: transaction.type === "הכנסה" ? "green" : "red",
                          fontWeight: "bold",
                        }}
                      >
                        {transaction.type === "הכנסה" ? "+" : "-"}₪
                        {Number(transaction.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      style={{ padding: "2rem", textAlign: "center" }}
                    >
                      לא נמצאו עסקאות התואמות את הפילטרים שנבחרו
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* מידע על מספר העסקאות המוצגות */}
          <div style={{ margin: "1rem 0", color: "#666" }}>
            מציג {filteredTransactions.length} מתוך {transactions.length} עסקאות
          </div>
        </>
      )}
    </div>
  );
}

export default Transactions;
