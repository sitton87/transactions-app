export function extractInvoiceData(text) {
  const amountMatch = text.match(/(?:סכום|סה"כ|לתשלום)[^\d]{0,10}([\d,.]+)/i);
  const invoiceMatch = text.match(
    /(?:חשבונית(?: מס)?(?: מספר)?)[^\d]{0,10}([\w\d-]+)/i
  );
  const dateMatch = text.match(/(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/);
  const businessMatch = text.match(
    /(?:שם העסק|עסק|ח.פ\.|חברה)\s*[:\-]?\s*(.+)/i
  );

  return {
    amount: amountMatch?.[1]?.replace(",", ".") || "",
    invoice_number: invoiceMatch?.[1] || "",
    date: normalizeDate(dateMatch?.[1]) || "",
    business_name: businessMatch?.[1]?.trim() || "",
  };
}

function normalizeDate(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split(/[./-]/);
  if (parts[2]?.length === 2) {
    parts[2] = "20" + parts[2];
  }
  return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(
    2,
    "0"
  )}`;
}
