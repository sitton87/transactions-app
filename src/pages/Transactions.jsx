import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// יצירת קליינט של Supabase
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
  const [typeFilter, setTypeFilter] = useState(""); // הכנסה או הוצאה
  const [categoryFilter, setCategoryFilter] = useState("");

  // סטייט לאפשרויות בסלקטים
  const [categories, setCategories] = useState([]);

  // פונקציה לייצוא הנתונים לקובץ CSV
  const handleExportCSV = () => {
    const headers = [
      "תאריך",
      "סוג עסק",
      "קטגוריה",
      "תיאור",
      "סוג",
      "סכום",
      "קובץ",
    ];

    const rows = filteredTransactions.map((tx) => [
      tx.date,
      tx.business_type,
      tx.category,
      tx.description,
      tx.type,
      tx.amount,
      tx.document_url || "",
    ]);

    // הוספת BOM (Byte Order Mark) כדי שאקסל יזהה את הקובץ כ-UTF-8
    const BOM = "\uFEFF";
    const csvContent =
      BOM +
      [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

    // שימוש בקידוד UTF-8 עם BOM לתמיכה בעברית
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Sendi_Transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
            description,
            suppliers(name),
            categories(name),
            payment_methods(name),
            source_types(name),
            source_codes(code, description)
          `
          )
          .order("date", { ascending: false });

        if (error) {
          throw error;
        }

        // עיבוד הנתונים שהגיעו מהשרת
        if (data && data.length > 0) {
          const formattedData = data.map((item) => ({
            id: item.id,
            date: item.date,
            type:
              item.type === "income"
                ? "הכנסה"
                : item.type === "expense"
                ? "הוצאה"
                : item.type,
            amount: item.amount,
            invoice_number: item.invoice_number,
            document_url: item.document_url,
            business_type:
              item.business_type === "farm"
                ? "חוות מתניה"
                : item.business_type === "soup_kitchen"
                ? "עזר לזולת"
                : item.business_type || "",
            category:
              item.type === "income"
                ? item.source_types?.name || ""
                : item.categories?.name || "",
            payment_method: item.payment_methods?.name || "",
            description:
              item.description ||
              item.invoice_number ||
              item.source_codes?.description ||
              "",
          }));

          setTransactions(formattedData);

          const uniqueCategories = [
            ...new Set(
              formattedData.map((item) => item.category).filter(Boolean)
            ),
          ];
          setCategories(uniqueCategories.sort());
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

  // סינון העסקאות לפי הפילטרים שנבחרו
  const filteredTransactions = transactions.filter((transaction) => {
    // סינון לפי סוג עסק
    if (
      businessTypeFilter &&
      transaction.business_type !== businessTypeFilter
    ) {
      return false;
    }

    // סינון לפי תאריך התחלה
    if (startDate && transaction.date < startDate) {
      return false;
    }

    // סינון לפי תאריך סיום
    if (endDate && transaction.date > endDate) {
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
    setBusinessTypeFilter("");
    setStartDate("");
    setEndDate("");
    setTypeFilter("");
    setCategoryFilter("");
  };

  return (
    <div style={{ padding: "2rem", direction: "rtl" }}>
      <h2>רשימת עסקאות</h2>
      <p>כאן תוכל לראות את כל העסקאות שנרשמו במערכת ולסנן אותן לפי צרכיך.</p>

      {/* כפתור הורדת CSV */}
      <button
        onClick={handleExportCSV}
        style={{
          marginBottom: "1rem",
          padding: "0.5rem 1rem",
          backgroundColor: "#2196f3",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        📄 ייצא כ-CSV
      </button>

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
            <div style={{ flex: "1 1 200px", marginBottom: "1rem" }}>
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
                <option value="עזר לזולת">עזר לזולת</option>
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
              {/* סינון לפי קטגוריה/סוג מקור */}
              <div style={{ flex: "1 1 200px" }}>
                <label
                  htmlFor="category-filter"
                  style={{ display: "block", marginBottom: "0.5rem" }}
                >
                  קטגוריה/סוג מקור:
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
                  <option value="">הכל</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
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
                    סוג עסק
                  </th>
                  <th style={{ padding: "0.75rem", textAlign: "right" }}>
                    קטגוריה/מקור
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
                  <th style={{ padding: "0.75rem", textAlign: "center" }}>
                    קובץ
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
                        {transaction.business_type}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        {transaction.category}
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
                      <td style={{ padding: "0.75rem", textAlign: "center" }}>
                        {transaction.document_url ? (
                          <a
                            href={transaction.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#3f51b5",
                              textDecoration: "none",
                              fontWeight: "bold",
                            }}
                          >
                            🔗 צפה
                          </a>
                        ) : (
                          "-"
                        )}
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
