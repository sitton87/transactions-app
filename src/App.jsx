import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/auth-context"; // שים לב לנתיב - לפי המבנה שלך

import AddTransaction from "./pages/AddTransaction";
import Transactions from "./pages/Transactions";
import SettingsPage from "./pages/Settings";
import UserManagementPage from "./pages/UserManagement";
import Layout from "./components/Layout";
import Login from "./pages/Login"; // נניח שיצרת דף התחברות
import { ProtectedRoute } from "./context/auth-context"; // ייבוא רכיב ההגנה

function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/add" />} />
          <Route path="/login" element={<Login />} />

          {/* דפים מוגנים - רק למשתמשים מחוברים */}
          <Route
            path="/add"
            element={
              <ProtectedRoute>
                <AddTransaction />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* דף רק למנהלים עם הרשאות ניהול משתמשים */}
          <Route
            path="/users"
            element={
              <ProtectedRoute permissions={["users:manage"]}>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}

export default App;
import ResetPassword from "./pages/ResetPassword";

<Route path="/reset-password" element={<ResetPassword />} />;
