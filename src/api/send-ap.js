// /api/send-zip.js
import JSZip from "jszip";
import { createTransport } from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { transactions, userEmail } = req.body;

    if (!transactions || !userEmail) {
      return res.status(400).json({ error: "Missing data" });
    }

    const zip = new JSZip();

    // טקסט עם הנתונים בפורמט CSV פשוט
    let csvContent = "תאריך,סוג עסק,קטגוריה,תיאור,סוג,סכום\n";
    for (const tx of transactions) {
      csvContent += `"${tx.date}","${tx.business_type}","${tx.category}","${tx.description}","${tx.type}","${tx.amount}"
`;

      // אם יש קובץ מצורף - נוריד אותו ונכניס לתוך הזיפ
      if (tx.document_url) {
        const response = await fetch(tx.document_url);
        const blob = await response.blob();
        const buffer = await blob.arrayBuffer();

        const extension = tx.document_url.split(".").pop().split("?")[0];
        const fileName = `${tx.date}_${tx.description || tx.id}.${extension}`;

        zip.file(fileName, buffer);
      }
    }

    // הוסף את ה־CSV
    zip.file("transactions.csv", csvContent);

    // צור את קובץ ה־ZIP
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    // שליחת המייל
    const transporter = createTransport({
      service: "gmail", // תוכל לשנות ל־Mailgun, Sendgrid וכו'
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: userEmail,
      subject: "סיכום עסקאות - קובץ ZIP",
      text: "מצורף קובץ zip עם פירוט העסקאות שלך.",
      attachments: [
        {
          filename: "transactions.zip",
          content: zipBuffer,
        },
      ],
    });

    res.status(200).json({ message: "הקובץ נשלח בהצלחה" });
  } catch (error) {
    console.error("שגיאה בשליחת ZIP:", error);
    res.status(500).json({ error: "בעיה בשליחה למייל" });
  }
}
