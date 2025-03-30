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
      {/* Header - only has logo and menu button */}
      <header className="flex items-center justify-between p-4 bg-white shadow fixed top-0 right-0 w-full z-30">
        <h1 className="text-lg font-bold">פיננסי</h1>
        <button onClick={toggleMenu} aria-label="תפריט">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Overlay when menu is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={closeMenu}
        />
      )}

      {/* Dropdown Menu - Only appears when menu button is clicked */}
      {isOpen && (
        <div className="fixed top-16 right-0 w-full max-w-xs bg-white shadow-lg z-40">
          <nav className="flex flex-col py-2 w-full">
            {navItems.map(({ path, label, icon }) => (
              <Link
                key={path}
                to={path}
                onClick={closeMenu}
                className={`flex items-center gap-2 px-4 py-3 transition w-full border-b border-gray-100
                ${
                  location.pathname === path
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {icon}
                <span>{label}</span>
              </Link>
            ))}
            <button
              onClick={() => alert("התנתקות עדיין לא פעילה")}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 text-right w-full"
            >
              <LogOut />
              <span>התנתק</span>
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 mt-16 p-4 overflow-auto">{children}</main>
    </div>
  );
}
