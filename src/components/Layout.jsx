// src/components/Layout.jsx
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  PlusCircle,
  ReceiptText,
  Settings,
  Users,
  LogOut,
} from "lucide-react";
// ייבוא של הלוגו
import logoImage from "../assets/images/לוגו סנדי.jpg"; // שים לב לשם הקובץ

const navItems = [
  { path: "/add", label: "הוסף עסקה", icon: <PlusCircle /> },
  { path: "/transactions", label: "עסקאות", icon: <ReceiptText /> },
  { path: "/settings", label: "הגדרות", icon: <Settings /> },
  { path: "/users", label: "ניהול משתמשים", icon: <Users /> },
];

export default function Layout({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-white shadow fixed top-0 right-0 w-full z-30">
        <div className="flex items-center">
          <img
            src={logoImage}
            alt="לוגו עזרה לזולת"
            className="h-6 w-12 object-contain ml-2"
          />
          <h1 className="text-lg font-bold">עזרה לזולת</h1>
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
            <li style={{ display: "block", width: "100%" }}>
              <button
                onClick={() => alert("התנתקות עדיין לא פעילה")}
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
            </li>
          </ul>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 mt-16 p-4 overflow-auto">{children}</main>
    </div>
  );
}
