// src/pages/AddTransaction.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import "../styles/TransactionForms.css";
import DocumentCamera from "../components/DocumentCamera";

const AddTransaction = () => {
  const navigate = useNavigate();
  const [transactionType, setTransactionType] = useState("income"); // 'income' או 'expense'
  const [isLoading, setIsLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [formData, setFormData] = useState({
    // שדות משותפים
    date: "",
    amount: "",
    invoiceNumber: "",
    document: null,

    // שדות הכנסה
    sourceType: "",
    sourceCode: "",

    // שדות הוצאה
    categoryCode: "",
    subcategoryCode: "",
    supplierCode: "",
    paymentMethod: "",
    paymentNumber: "",
  });

  // רשימות נתונים לשדות ה-dropdown
  const [dropdownData, setDropdownData] = useState({
    sourceTypes: [],
    sourceCodes: [],
    categories: [],
    subcategories: [],
    filteredSubcategories: [],
    suppliers: [],
    paymentMethods: [],
    paymentNumbers: [],
    filteredPaymentNumbers: [],
  });

  // טעינת הנתונים מ-Supabase בטעינת הדף
  useEffect(() => {
    const fetchDropdownData = async () => {
      setIsLoading(true);
      try {
        // טעינת סוגי מקור
        const { data: sourceTypes, error: sourceTypesError } = await supabase
          .from("source_types")
          .select("*");

        if (sourceTypesError) throw sourceTypesError;

        // טעינת קודי מקור
        const { data: sourceCodes, error: sourceCodesError } = await supabase
          .from("source_codes")
          .select("*");

        if (sourceCodesError) throw sourceCodesError;

        // טעינת קטגוריות
        const { data: categories, error: categoriesError } = await supabase
          .from("categories")
          .select("*");

        if (categoriesError) throw categoriesError;

        // טעינת תת-קטגוריות
        const { data: subcategories, error: subcategoriesError } =
          await supabase.from("subcategories").select("*");

        if (subcategoriesError) throw subcategoriesError;

        // טעינת ספקים
        const { data: suppliers, error: suppliersError } = await supabase
          .from("suppliers")
          .select("*");

        if (suppliersError) throw suppliersError;

        // טעינת אמצעי תשלום
        const { data: paymentMethods, error: paymentMethodsError } =
          await supabase.from("payment_methods").select("*");

        if (paymentMethodsError) throw paymentMethodsError;

        // טעינת מספרי אמצעי תשלום
        const { data: paymentNumbers, error: paymentNumbersError } =
          await supabase.from("payment_numbers").select("*");

        if (paymentNumbersError) throw paymentNumbersError;

        setDropdownData({
          sourceTypes: sourceTypes || [],
          sourceCodes: sourceCodes || [],
          categories: categories || [],
          subcategories: subcategories || [],
          filteredSubcategories: [],
          suppliers: suppliers || [],
          paymentMethods: paymentMethods || [],
          paymentNumbers: paymentNumbers || [],
          filteredPaymentNumbers: [],
        });
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
        alert("שגיאה בטעינת נתונים. נא לרענן את הדף ולנסות שוב.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDropdownData();
  }, []);

  // עדכון שדות הטופס בעת שינוי
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file") {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // טיפול בשינוי קטגוריה
  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    handleChange(e);

    // סינון תת-קטגוריות לפי הקטגוריה שנבחרה
    const filteredSubcategories = dropdownData.subcategories.filter(
      (item) => item.category_id === categoryId
    );

    setDropdownData({
      ...dropdownData,
      filteredSubcategories,
    });

    // אם יש רק אפשרות אחת, נבחר אותה אוטומטית
    if (filteredSubcategories.length === 1) {
      setFormData({
        ...formData,
        categoryCode: categoryId,
        subcategoryCode: filteredSubcategories[0].id,
      });
    } else {
      // אחרת, מאפסים את הבחירה הקודמת
      setFormData({
        ...formData,
        categoryCode: categoryId,
        subcategoryCode: "",
      });
    }
  };

  // טיפול בשינוי אמצעי תשלום
  const handlePaymentMethodChange = (e) => {
    const methodId = e.target.value;
    handleChange(e);

    // סינון מספרי אמצעי תשלום לפי האמצעי שנבחר
    const filteredPaymentNumbers = dropdownData.paymentNumbers.filter(
      (item) => item.payment_method_id === methodId
    );

    setDropdownData({
      ...dropdownData,
      filteredPaymentNumbers,
    });

    // אם יש רק אפשרות אחת, נבחר אותה אוטומטית
    if (filteredPaymentNumbers.length === 1) {
      setFormData({
        ...formData,
        paymentMethod: methodId,
        paymentNumber: filteredPaymentNumbers[0].id,
      });
    } else {
      // אחרת, מאפסים את הבחירה הקודמת
      setFormData({
        ...formData,
        paymentMethod: methodId,
        paymentNumber: "",
      });
    }
  };

  // פונקציות לטיפול במצלמה
  const handleOpenCamera = () => {
    setShowCamera(true);
  };

  const handleCaptureDocument = (file) => {
    setFormData({ ...formData, document: file });
    setShowCamera(false);
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
  };

  // שליחת הטופס
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // העלאת המסמך, אם יש
      let documentUrl = null;
      if (formData.document) {
        const fileExt = formData.document.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from("transactiondocuments")
          .upload(fileName, formData.document);

        if (error) throw error;

        documentUrl = supabase.storage
          .from("transactiondocuments")
          .getPublicUrl(fileName).data.publicUrl;
      }

      // הכנת הנתונים לשמירה בהתאם לסוג העסקה
      const transactionData = {
        type: transactionType,
        date: formData.date,
        amount: parseFloat(formData.amount),
        invoice_number: formData.invoiceNumber || null,
        document_url: documentUrl,
      };

      // הוספת שדות בהתאם לסוג העסקה
      if (transactionType === "income") {
        transactionData.source_type_id = formData.sourceType || null;
        transactionData.source_code_id = formData.sourceCode || null;
      } else {
        transactionData.category_id = formData.categoryCode || null;
        transactionData.subcategory_id = formData.subcategoryCode || null;
        transactionData.supplier_id = formData.supplierCode || null;
        transactionData.payment_method_id = formData.paymentMethod;
        transactionData.payment_number_id = formData.paymentNumber;
      }

      // שמירת העסקה
      const { error } = await supabase
        .from("transactions")
        .insert([transactionData]);

      if (error) throw error;

      // איפוס הטופס
      setFormData({
        date: "",
        amount: "",
        invoiceNumber: "",
        document: null,
        sourceType: "",
        sourceCode: "",
        categoryCode: "",
        subcategoryCode: "",
        supplierCode: "",
        paymentMethod: "",
        paymentNumber: "",
      });

      // איפוס התת-קטגוריות ומספרי אמצעי תשלום המסוננים
      setDropdownData({
        ...dropdownData,
        filteredSubcategories: [],
        filteredPaymentNumbers: [],
      });

      // להציג הודעת הצלחה
      alert("העסקה נשמרה בהצלחה!");

      // במקום לנווט לדף אחר, אנחנו נשארים באותו דף עם הטופס מאופס
      // navigate("/transactions");
    } catch (error) {
      console.error("Error saving transaction:", error);
      alert(`אירעה שגיאה בשמירת העסקה: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && dropdownData.sourceTypes.length === 0) {
    return <div className="loading">טוען נתונים...</div>;
  }

  return (
    <div className="transaction-form-container">
      <h1>הוספת עסקה חדשה</h1>

      <div className="transaction-type-selector">
        <button
          type="button"
          className={transactionType === "income" ? "active" : ""}
          onClick={() => setTransactionType("income")}
        >
          הכנסה
        </button>
        <button
          type="button"
          className={transactionType === "expense" ? "active" : ""}
          onClick={() => setTransactionType("expense")}
        >
          הוצאה
        </button>
      </div>

      <form onSubmit={handleSubmit} className="transaction-form">
        {/* טופס הכנסה */}
        {transactionType === "income" && (
          <div className="income-form">
            <div className="form-group">
              <label htmlFor="date">תאריך (פתיחת יומן)</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                //required
              />
            </div>

            <div className="form-group">
              <label htmlFor="amount">סכום</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="invoiceNumber">מספר חשבונית</label>
              <input
                type="text"
                id="invoiceNumber"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleChange}
                //required
              />
            </div>

            <div className="form-group">
              <label htmlFor="sourceType">סוג מקור</label>
              <select
                id="sourceType"
                name="sourceType"
                value={formData.sourceType}
                onChange={handleChange}
                required
              >
                <option value="">בחר סוג מקור...</option>
                {dropdownData.sourceTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="sourceCode">קוד מקור</label>
              <select
                id="sourceCode"
                name="sourceCode"
                value={formData.sourceCode}
                onChange={handleChange}
              >
                <option value="">בחר קוד מקור...</option>
                {dropdownData.sourceCodes.map((code) => (
                  <option key={code.id} value={code.id}>
                    {code.code} - {code.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="document">הוספת מסמך</label>
              <div className="document-upload-container">
                <input
                  type="file"
                  id="document"
                  name="document"
                  onChange={handleChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  style={{ display: formData.document ? "none" : "block" }}
                />
                {formData.document && (
                  <div className="selected-document">
                    <span>{formData.document.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, document: null })
                      }
                    >
                      הסר
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  className="camera-button"
                  onClick={handleOpenCamera}
                >
                  צלם מסמך
                </button>
              </div>
              <small>(אופציונלי)</small>
            </div>
          </div>
        )}

        {/* טופס הוצאה */}
        {transactionType === "expense" && (
          <div className="expense-form">
            <div className="form-group">
              <label htmlFor="date">תאריך</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                //required
              />
            </div>

            <div className="form-group">
              <label htmlFor="categoryCode">קוד קטגוריה</label>
              <select
                id="categoryCode"
                name="categoryCode"
                value={formData.categoryCode}
                onChange={handleCategoryChange}
                required
              >
                <option value="">בחר קטגוריה...</option>
                {dropdownData.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.code} - {category.name}
                  </option>
                ))}
              </select>
            </div>
            {/*
            <div className="form-group">
              <label htmlFor="subcategoryCode">קוד תת קטגוריה</label>
              <select
                id="subcategoryCode"
                name="subcategoryCode"
                value={formData.subcategoryCode}
                onChange={handleChange}
                required
                disabled={!formData.categoryCode}
              >
                <option value="">בחר תת-קטגוריה...</option>
                {(dropdownData.filteredSubcategories.length > 0
                  ? dropdownData.filteredSubcategories
                  : dropdownData.subcategories.filter(
                      (item) =>
                        !formData.categoryCode ||
                        item.category_id === formData.categoryCode
                    )
                ).map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.code} - {subcategory.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="supplierCode">קוד ספק</label>
              <select
                id="supplierCode"
                name="supplierCode"
                value={formData.supplierCode}
                onChange={handleChange}
                required
              >
                <option value="">בחר ספק...</option>
                {dropdownData.suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.code} - {supplier.name}
                  </option>
                ))}
              </select>
            </div>
*/}
            <div className="form-group">
              <label htmlFor="amount">סכום</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="paymentMethod">אמצעי תשלום</label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handlePaymentMethodChange}
                required
              >
                <option value="">בחר אמצעי תשלום...</option>
                {dropdownData.paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="paymentNumber">מספר אמצעי</label>
              <select
                id="paymentNumber"
                name="paymentNumber"
                value={formData.paymentNumber}
                onChange={handleChange}
                required
                disabled={!formData.paymentMethod}
              >
                <option value="">בחר מספר אמצעי...</option>
                {(dropdownData.filteredPaymentNumbers.length > 0
                  ? dropdownData.filteredPaymentNumbers
                  : dropdownData.paymentNumbers.filter(
                      (item) =>
                        !formData.paymentMethod ||
                        item.payment_method_id === formData.paymentMethod
                    )
                ).map((number) => (
                  <option key={number.id} value={number.id}>
                    {number.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="invoiceNumber">מס' חשבונית</label>
              <input
                type="text"
                id="invoiceNumber"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="document">הוספת מסמך</label>
              <div className="document-upload-container">
                <input
                  type="file"
                  id="document"
                  name="document"
                  onChange={handleChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  style={{ display: formData.document ? "none" : "block" }}
                />
                {formData.document && (
                  <div className="selected-document">
                    <span>{formData.document.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, document: null })
                      }
                    >
                      הסר
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  className="camera-button"
                  onClick={handleOpenCamera}
                >
                  צלם מסמך
                </button>
              </div>
              <small>(אופציונלי)</small>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? "שומר..." : "שמור עסקה"}
          </button>
          <button
            type="button"
            className="cancel-button"
            onClick={() => navigate("/transactions")}
            disabled={isLoading}
          >
            ביטול
          </button>
        </div>
      </form>

      {showCamera && (
        <DocumentCamera
          onCapture={handleCaptureDocument}
          onClose={handleCloseCamera}
        />
      )}
    </div>
  );
};

export default AddTransaction;
