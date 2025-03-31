// src/lib/authUtils.js
import { supabase } from "./supabaseClient";

/**
 * בדיקה אם משתמש נמצא בטבלת המשתמשים המורשים
 * @param {string} email - כתובת האימייל לבדיקה
 * @returns {Promise<boolean>} - האם המשתמש מורשה
 */
export const checkAuthorizedUser = async (email) => {
  try {
    const { data, error } = await supabase
      .from("authorized_users")
      .select("email")
      .eq("email", email)
      .single();

    if (error) throw error;

    // אם הגענו לכאן, הנתונים קיימים והמשתמש מורשה
    return true;
  } catch (error) {
    console.error("Error checking authorized user:", error);
    // אם הגענו לכאן, אין התאמה או שיש שגיאה אחרת
    return false;
  }
};

/**
 * יצירת קוד OTP אקראי
 * @param {number} length - אורך הקוד
 * @returns {string} - קוד OTP
 */
export const generateOTP = (length = 6) => {
  const chars = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += chars[Math.floor(Math.random() * chars.length)];
  }
  return otp;
};

/**
 * שמירת קוד OTP בטבלת הקודים
 * @param {string} email - כתובת האימייל
 * @param {string} otp - קוד האימות
 * @returns {Promise<boolean>} - האם הקוד נשמר בהצלחה
 */
export const saveOTP = async (email, otp) => {
  try {
    // חישוב זמן תפוגה (10 דקות מעכשיו)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // שמירת הקוד בטבלה
    const { error } = await supabase.from("otp_codes").upsert(
      {
        email,
        code: otp,
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        attempts: 0,
      },
      { onConflict: "email" }
    );

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Error saving OTP:", error);
    return false;
  }
};

/**
 * שליחת קוד OTP באימייל
 * @param {string} email - כתובת האימייל
 * @param {string} otp - קוד האימות
 * @returns {Promise<boolean>} - האם האימייל נשלח בהצלחה
 */
export const sendOTPEmail = async (email, otp) => {
  try {
    // שליחת האימייל באמצעות Supabase Edge Function
    const { error } = await supabase.functions.invoke("send-otp-email", {
      body: { email, otp },
    });

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return false;
  }
};

/**
 * בדיקת תקינות של קוד OTP
 * @param {string} email - כתובת האימייל
 * @param {string} otp - קוד האימות שהוזן
 * @returns {Promise<boolean>} - האם הקוד תקין
 */
export const verifyOTP = async (email, otp) => {
  try {
    const { data, error } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("email", email)
      .single();

    if (error) throw error;

    // בדיקה שהקוד לא פג תוקף
    const expiryTime = new Date(data.expires_at);
    if (expiryTime < new Date()) {
      throw new Error("הקוד פג תוקף, אנא בקש קוד חדש");
    }

    // בדיקה שהקוד תואם
    if (data.code !== otp) {
      // עדכון מספר הניסיונות
      await supabase
        .from("otp_codes")
        .update({ attempts: data.attempts + 1 })
        .eq("email", email);

      throw new Error("קוד שגוי, אנא נסה שוב");
    }

    // מחיקת הקוד לאחר שימוש מוצלח
    await supabase.from("otp_codes").delete().eq("email", email);

    return true;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return false;
  }
};

/**
 * הרשמת משתמש חדש עם אימות OTP
 * @param {string} email - כתובת האימייל
 * @param {string} password - הסיסמה
 * @returns {Promise<{success: boolean, otp: string, error: string | null}>}
 */
export const registerWithOTP = async (email, password) => {
  try {
    // בדיקה אם המשתמש מורשה
    const isAuthorized = await checkAuthorizedUser(email);
    if (!isAuthorized) {
      return {
        success: false,
        otp: null,
        error: "המשתמש אינו מורשה להירשם למערכת",
      };
    }

    // יצירת קוד OTP
    const otp = generateOTP();

    // שמירת הקוד בדאטהבייס
    const saved = await saveOTP(email, otp);
    if (!saved) {
      return {
        success: false,
        otp: null,
        error: "שגיאה בשמירת קוד האימות",
      };
    }

    // שליחת קוד OTP באימייל
    const sent = await sendOTPEmail(email, otp);
    if (!sent) {
      return {
        success: false,
        otp: null,
        error: "שגיאה בשליחת קוד האימות",
      };
    }

    // החזרת ה-OTP לצורכי פיתוח, במערכת אמיתית לא תחזיר אותו ללקוח
    return {
      success: true,
      otp: otp, // בסביבת ייצור אל תחזיר את זה!
      error: null,
    };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      otp: null,
      error: error.message,
    };
  }
};

/**
 * השלמת הרשמה אחרי אימות OTP
 * @param {string} email - כתובת האימייל
 * @param {string} password - הסיסמה
 * @param {string} otp - קוד האימות
 * @returns {Promise<{success: boolean, error: string | null}>}
 */
export const completeRegistration = async (email, password, otp) => {
  try {
    // אימות הקוד
    const verified = await verifyOTP(email, otp);
    if (!verified) {
      return {
        success: false,
        error: "קוד אימות שגוי או שפג תוקפו",
      };
    }

    // הרשמת המשתמש ב-Supabase Auth
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) throw error;

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Complete registration error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * התחברות למערכת
 * @param {string} email - כתובת האימייל
 * @param {string} password - הסיסמה
 * @returns {Promise<{success: boolean, error: string | null}>}
 */
export const loginUser = async (email, password) => {
  try {
    // בדיקה אם המשתמש מורשה
    const isAuthorized = await checkAuthorizedUser(email);
    if (!isAuthorized) {
      return {
        success: false,
        error: "המשתמש אינו מורשה להתחבר למערכת",
      };
    }

    // התחברות באמצעות Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
