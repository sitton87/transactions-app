// src/components/Layout.jsx
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/TransactionForms.css";
import { useAuth } from "../context/auth-context"; // ייבוא הוק האימות
import {
  Menu,
  X,
  PlusCircle,
  ReceiptText,
  Settings,
  Users,
  LogOut,
  LogIn,
} from "lucide-react";

export default function Layout({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userProfile, signOut, hasPermission, isAuthenticated } =
    useAuth(); // שימוש בהוק האימות

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  // פונקציה להתנתקות
  const handleLogout = async () => {
    await signOut();
    navigate("/login");
    closeMenu();
  };

  // מגדיר את פריטי התפריט עם בדיקת הרשאות
  const getNavItems = () => {
    const items = [
      {
        path: "/add",
        label: "הוסף עסקה",
        icon: <PlusCircle />,
        requiresAuth: true,
      },
      {
        path: "/transactions",
        label: "עסקאות",
        icon: <ReceiptText />,
        requiresAuth: true,
      },
      {
        path: "/settings",
        label: "הגדרות",
        icon: <Settings />,
        requiresAuth: true,
      },
    ];

    // הוספת ניהול משתמשים רק למי שיש לו הרשאה מתאימה
    if (hasPermission("users:manage")) {
      items.push({
        path: "/users",
        label: "ניהול משתמשים",
        icon: <Users />,
        requiresAuth: true,
      });
    }

    // מחזיר רק את הפריטים הרלוונטיים למצב ההתחברות של המשתמש
    return items.filter((item) => !item.requiresAuth || isAuthenticated);
  };

  const navItems = getNavItems();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-white shadow fixed top-0 right-0 w-full z-30">
        <div className="flex items-center">
          <h1 className="text-lg font-bold">עזר לזולת</h1>
        </div>
        <button onClick={toggleMenu} aria-label="תפריט">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={closeMenu}
        />
      )}

      {/* Menu - with explicit display: block styling */}
      {isOpen && (
        <div
          className="fixed top-16 right-0 bg-white shadow-lg z-40"
          style={{ width: "250px", display: "block" }} // Force block display
        >
          <ul
            style={{
              display: "block",
              listStyle: "none",
              padding: 0,
              margin: 0,
            }}
          >
            {/* פרטי המשתמש המחובר */}
            {isAuthenticated && (
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #eee",
                  backgroundColor: "#f9fafb",
                  textAlign: "center",
                }}
              >
                <p style={{ fontWeight: "bold" }}>
                  {user?.email || "משתמש מחובר"}
                </p>
                {userProfile?.full_name && (
                  <p style={{ fontSize: "0.8rem", color: "#4b5563" }}>
                    {userProfile.full_name}
                  </p>
                )}
              </div>
            )}

            {navItems.map(({ path, label, icon }) => (
              <li key={path} style={{ display: "block", width: "100%" }}>
                <Link
                  to={path}
                  onClick={closeMenu}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderBottom: "1px solid #eee",
                    color: location.pathname === path ? "#1d4ed8" : "#333",
                    backgroundColor:
                      location.pathname === path ? "#dbeafe" : "transparent",
                    textDecoration: "none",
                    width: "100%",
                  }}
                >
                  <span style={{ marginLeft: "8px" }}>{icon}</span>
                  <span>{label}</span>
                </Link>
              </li>
            ))}

            {/* כפתור התחברות/התנתקות */}
            <li style={{ display: "block", width: "100%" }}>
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderBottom: "1px solid #eee",
                    color: "#333",
                    backgroundColor: "transparent",
                    textDecoration: "none",
                    width: "100%",
                    textAlign: "right",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "1rem",
                  }}
                >
                  <span style={{ marginLeft: "8px" }}>
                    <LogOut />
                  </span>
                  <span>התנתק</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={closeMenu}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderBottom: "1px solid #eee",
                    color: "#333",
                    backgroundColor: "transparent",
                    textDecoration: "none",
                    width: "100%",
                    textAlign: "right",
                    fontSize: "1rem",
                  }}
                >
                  <span style={{ marginLeft: "8px" }}>
                    <LogIn />
                  </span>
                  <span>התחבר</span>
                </Link>
              )}
            </li>
          </ul>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 mt-16 p-4 overflow-auto">{children}</main>
    </div>
  );
}
