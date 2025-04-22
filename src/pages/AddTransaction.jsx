// src/pages/AddTransaction.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import "../styles/TransactionForms.css";
import DocumentCamera from "../components/DocumentCamera";
import Label from "../components/Label";

const AddTransaction = () => {
  const navigate = useNavigate();
  const [transactionType, setTransactionType] = useState("income"); // 'income' or 'expense'
  const [isLoading, setIsLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [formData, setFormData] = useState({
    // Common fields
    date: "",
    amount: "",
    invoiceNumber: "",
    document: null,
    businessType: "",

    // Income fields
    sourceType: "",
    sourceCode: "",

    // Expense fields
    categoryCode: "",
    subcategoryCode: "",
    supplierCode: "",
    paymentMethod: "",
    paymentNumber: "",
  });

  // Dropdown data for form fields
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

  // Load data from Supabase on page load
  useEffect(() => {
    const fetchDropdownData = async () => {
      setIsLoading(true);
      try {
        // Load source types
        const { data: sourceTypes, error: sourceTypesError } = await supabase
          .from("source_types")
          .select("*");

        if (sourceTypesError) throw sourceTypesError;

        // Load source codes
        const { data: sourceCodes, error: sourceCodesError } = await supabase
          .from("source_codes")
          .select("*");

        if (sourceCodesError) throw sourceCodesError;

        // Load categories
        const { data: categories, error: categoriesError } = await supabase
          .from("categories")
          .select("*");

        if (categoriesError) throw categoriesError;

        // Load subcategories
        const { data: subcategories, error: subcategoriesError } =
          await supabase.from("subcategories").select("*");

        if (subcategoriesError) throw subcategoriesError;

        // Load suppliers
        const { data: suppliers, error: suppliersError } = await supabase
          .from("suppliers")
          .select("*");

        if (suppliersError) throw suppliersError;

        // Load payment methods
        const { data: paymentMethods, error: paymentMethodsError } =
          await supabase.from("payment_methods").select("*");

        if (paymentMethodsError) throw paymentMethodsError;

        // Load payment numbers
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

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file") {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Handle category change with subcategory filtering
  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    handleChange(e);

    // Filter subcategories by selected category
    const filteredSubcategories = dropdownData.subcategories.filter(
      (item) => item.category_id === categoryId
    );

    setDropdownData({
      ...dropdownData,
      filteredSubcategories,
    });

    // If only one option, select it automatically
    if (filteredSubcategories.length === 1) {
      setFormData({
        ...formData,
        categoryCode: categoryId,
        subcategoryCode: filteredSubcategories[0].id,
      });
    } else {
      // Otherwise, reset previous selection
      setFormData({
        ...formData,
        categoryCode: categoryId,
        subcategoryCode: "",
      });
    }
  };

  // Handle payment method change with payment number filtering
  const handlePaymentMethodChange = (e) => {
    const methodId = e.target.value;
    handleChange(e); // Standard update

    const selectedMethod = dropdownData.paymentMethods.find(
      (method) => method.id === methodId
    );

    const isCash = selectedMethod?.name === "מזומן"; // Change based on your DB name

    if (isCash) {
      // If cash - reset payment number and filter
      setFormData((prev) => ({
        ...prev,
        paymentMethod: methodId,
        paymentNumber: "",
      }));
      setDropdownData((prev) => ({
        ...prev,
        filteredPaymentNumbers: [],
      }));
      return;
    }

    // Otherwise - filter as usual
    const filteredPaymentNumbers = dropdownData.paymentNumbers.filter(
      (item) => item.payment_method_id === methodId
    );

    setDropdownData((prev) => ({
      ...prev,
      filteredPaymentNumbers,
    }));

    setFormData((prev) => ({
      ...prev,
      paymentMethod: methodId,
      paymentNumber:
        filteredPaymentNumbers.length === 1 ? filteredPaymentNumbers[0].id : "",
    }));
  };

  // Camera functions
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

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Upload document if exists
      let documentUrl = null;
      if (formData.document) {
        const fileExt = formData.document.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from("transactiondocuments")
          .upload(fileName, formData.document);

        if (error) throw error;

        // Fix: Proper way to get public URL
        const { data: urlData } = supabase.storage
          .from("transactiondocuments")
          .getPublicUrl(fileName);

        documentUrl = urlData.publicUrl;
      }

      // Prepare data for saving based on transaction type
      const transactionData = {
        type: transactionType,
        date: formData.date,
        amount: parseFloat(formData.amount) || 0, // Fix: Add fallback for empty amount
        invoice_number: formData.invoiceNumber || null,
        document_url: documentUrl,
        business_type: formData.businessType,
      };

      // Add fields based on transaction type
      if (transactionType === "income") {
        transactionData.source_type_id = formData.sourceType || null;
        transactionData.source_code_id = formData.sourceCode || null;
      } else {
        transactionData.category_id = formData.categoryCode || null;
        transactionData.subcategory_id = formData.subcategoryCode || null;
        transactionData.supplier_id = formData.supplierCode || null;
        transactionData.payment_method_id = formData.paymentMethod || null; // Fix: Add null fallback
        transactionData.payment_number_id = formData.paymentNumber || null; // Fix: Add null fallback
      }

      // Save transaction
      const { error } = await supabase
        .from("transactions")
        .insert([transactionData]);

      if (error) throw error;

      // Reset form
      setFormData({
        date: "",
        amount: "",
        invoiceNumber: "",
        document: null,
        businessType: "", // Fix: Also reset business type
        sourceType: "",
        sourceCode: "",
        categoryCode: "",
        subcategoryCode: "",
        supplierCode: "",
        paymentMethod: "",
        paymentNumber: "",
      });

      // Reset filtered subcategories and payment numbers
      setDropdownData({
        ...dropdownData,
        filteredSubcategories: [],
        filteredPaymentNumbers: [],
      });

      // Show success message
      alert("העסקה נשמרה בהצלחה!");

      // We stay on the same page with reset form
      // navigate("/transactions");
    } catch (error) {
      console.error("Error saving transaction:", error);
      alert(`אירעה שגיאה בשמירת העסקה: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading indicator when data is being fetched
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
        {/* Income form */}
        {transactionType === "income" && (
          <div className="income-form">
            <div className="form-group">
              <Label htmlFor="businessType" required>
                סוג עסק
              </Label>
              <select
                id="businessType"
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
                required
              >
                <option value="">בחר סוג עסק...</option>
                <option value="farm">חוות מתניה</option>
                <option value="soup_kitchen">עזר לזולת</option>
              </select>
            </div>

            <div className="form-group">
              <Label htmlFor="date" required>
                תאריך (פתיחת יומן)
              </Label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <Label htmlFor="amount" required>
                סכום
              </Label>
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
              <Label htmlFor="invoiceNumber">מספר חשבונית</Label>
              <input
                type="text"
                id="invoiceNumber"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <Label htmlFor="sourceType" required>
                סוג מקור
              </Label>
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
              <Label htmlFor="sourceCode">קוד מקור</Label>
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
              <Label htmlFor="document">הוספת מסמך</Label>
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

        {/* Expense form */}
        {transactionType === "expense" && (
          <div className="expense-form">
            <div className="form-group">
              <Label htmlFor="businessType" required>
                סוג עסק
              </Label>
              <select
                id="businessType"
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
                required
              >
                <option value="">בחר סוג עסק...</option>
                <option value="farm">חוות מתניה</option>
                <option value="soup_kitchen">עזר לזולת</option>
              </select>
            </div>

            <div className="form-group">
              <Label htmlFor="date" required>
                תאריך
              </Label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <Label htmlFor="categoryCode" required>
                קוד קטגוריה
              </Label>
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

            {/* Uncommented subcategory section 
            <div className="form-group">
              <Label htmlFor="subcategoryCode">קוד תת קטגוריה</Label>
              <select
                id="subcategoryCode"
                name="subcategoryCode"
                value={formData.subcategoryCode}
                onChange={handleChange}
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

            Uncommented supplier section 
            <div className="form-group">
              <Label htmlFor="supplierCode">קוד ספק</Label>
              <select
                id="supplierCode"
                name="supplierCode"
                value={formData.supplierCode}
                onChange={handleChange}
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
              <Label htmlFor="amount" required>
                סכום
              </Label>
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
              <Label htmlFor="paymentMethod" required>
                אמצעי תשלום
              </Label>
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
              <Label htmlFor="paymentNumber">מספר אמצעי</Label>
              <select
                id="paymentNumber"
                name="paymentNumber"
                value={formData.paymentNumber}
                onChange={handleChange}
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
              <Label htmlFor="invoiceNumber">מס' חשבונית</Label>
              <input
                type="text"
                id="invoiceNumber"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <Label htmlFor="document">הוספת מסמך</Label>
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
