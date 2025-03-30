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
    <div
      className="flex flex-col md:flex-row min-h-screen bg-gray-50"
      dir="rtl"
    >
      {/* Sidebar */}
      <div
        className={`fixed z-20 top-0 right-0 h-full w-64 bg-white shadow-md transform transition-transform duration-200 ease-in-out
          ${
            isOpen ? "translate-x-0" : "translate-x-full"
          } md:relative md:translate-x-0`}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">פיננסי</h2>
          <button className="md:hidden" onClick={toggleMenu}>
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map(({ path, label, icon }) => (
            <Link
              key={path}
              to={path}
              onClick={closeMenu}
              className={`flex items-center gap-2 p-2 rounded-md transition
                ${
                  location.pathname === path
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
            >
              {icon}
              {label}
            </Link>
          ))}
          <button
            onClick={() => alert("התנתקות עדיין לא פעילה")}
            className="flex items-center gap-2 p-2 rounded-md text-gray-700 hover:bg-gray-100"
          >
            <LogOut /> התנתק
          </button>
        </nav>
      </div>

      {/* Mobile menu button */}
      <header className="md:hidden p-4 border-b flex justify-between items-center bg-white shadow">
        <button onClick={toggleMenu}>
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold">פיננסי</h1>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 mt-16 md:mt-0 md:ml-64 overflow-auto">
        {children}
      </main>
    </div>
  );
}
