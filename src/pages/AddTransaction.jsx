import { supabase } from "../lib/supabaseClient";
import React, { useState, useRef } from "react";

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
  const fileInputRef = useRef(); // רפרנס לשדה הקובץ

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setForm({ ...form, file: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
    }
  };

  return (
    <div style={{ padding: "2rem", direction: "rtl" }}>
      <h2>הוסף עסקה</h2>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          maxWidth: "400px",
        }}
      >
        <label>
          סוג עסקה:
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="income">הכנסה</option>
            <option value="expense">הוצאה</option>
          </select>
        </label>

        <label>
          סכום:
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          מספר חשבונית:
          <input
            type="text"
            name="invoiceNumber"
            value={form.invoiceNumber}
            onChange={handleChange}
          />
        </label>

        <label>
          שם העסק:
          <input
            type="text"
            name="businessName"
            value={form.businessName}
            onChange={handleChange}
          />
        </label>

        <label>
          תאריך:
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          העלאת מסמך/תמונה:
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
          />
        </label>

        <button type="submit">שמור עסקה</button>
      </form>

      {success && <p style={{ color: "green" }}>✔️ העסקה נוספה בהצלחה!</p>}
    </div>
  );
}
