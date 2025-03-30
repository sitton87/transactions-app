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
import logoImage from "../assets/images/לוגו סנדי.jpg";

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
      {/* Header - רספונסיבי לפי גודל מסך */}
      <header className="flex items-center justify-between p-2 md:p-4 bg-white shadow fixed top-0 right-0 w-full z-30">
        <div className="flex items-center">
          {/* לוגו - גודל שונה בין מובייל למחשב */}
          <img
            src={logoImage}
            alt="לוגו עזרה לזולת"
            style={{
              transform: "scale(0.6)",
              transformOrigin: "right center",
              marginRight: "0px",
              marginLeft: "8px",
            }}
            className="md:scale-75" // גודל גדול יותר במחשב
          />
          <h1 className="text-base md:text-lg font-bold">עזרה לזולת</h1>
        </div>

        {/* כפתור תפריט - מוצג רק במובייל */}
        <button
          onClick={toggleMenu}
          aria-label="תפריט"
          className="block md:hidden"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* תפריט אופקי - מוצג רק במחשב */}
        <nav className="hidden md:flex items-center space-x-6">
          {navItems.map(({ path, label, icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center px-3 py-2 rounded transition ${
                location.pathname === path
                  ? "bg-blue-100 text-blue-800"
                  : "hover:bg-gray-100"
              }`}
            >
              <span className="ml-2">{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
          <button
            onClick={() => alert("התנתקות עדיין לא פעילה")}
            className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded transition"
          >
            <span className="ml-2">
              <LogOut />
            </span>
            <span>התנתק</span>
          </button>
        </nav>
      </header>

      {/* Overlay - מוצג רק במובייל כשהתפריט פתוח */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={closeMenu}
        />
      )}

      {/* תפריט נפתח - מוצג רק במובייל כשהתפריט פתוח */}
      {isOpen && (
        <div
          className="fixed top-16 right-0 bg-white shadow-lg z-40 md:hidden"
          style={{ width: "250px" }}
        >
          <ul className="py-2">
            {navItems.map(({ path, label, icon }) => (
              <li key={path}>
                <Link
                  to={path}
                  onClick={closeMenu}
                  className={`flex items-center px-4 py-3 border-b border-gray-100 ${
                    location.pathname === path ? "bg-blue-50 text-blue-800" : ""
                  }`}
                >
                  <span className="ml-3">{icon}</span>
                  <span>{label}</span>
                </Link>
              </li>
            ))}
            <li>
              <button
                onClick={() => alert("התנתקות עדיין לא פעילה")}
                className="flex items-center px-4 py-3 w-full text-right"
              >
                <span className="ml-3">
                  <LogOut />
                </span>
                <span>התנתק</span>
              </button>
            </li>
          </ul>
        </div>
      )}

      {/* Main Content - ריווח שונה בין מובייל למחשב */}
      <main className="flex-1 mt-14 md:mt-16 p-2 md:p-4 overflow-auto">
        {children}
      </main>
    </div>
  );
}
