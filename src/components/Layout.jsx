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
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-white shadow fixed top-0 right-0 w-full z-30">
        <h1 className="text-lg font-bold">פיננסי</h1>
        <button onClick={toggleMenu}>
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-md z-40 transform transition-transform duration-200 ease-in-out
        ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } md:relative md:translate-x-0 md:block`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">פיננסי</h2>
          <button className="md:hidden" onClick={toggleMenu}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4">
          <div className="flex flex-col space-y-2">
            {navItems.map(({ path, label, icon }) => (
              <Link
                key={path}
                to={path}
                onClick={closeMenu}
                className={`flex items-center gap-2 p-2 rounded-md transition ${
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
              <LogOut />
              התנתק
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 mt-16 md:mt-0 md:mr-64 p-4">{children}</main>
    </div>
  );
}
