import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/auth-context";
import AddTransaction from "./pages/AddTransaction";
import Transactions from "./pages/Transactions";
import SettingsPage from "./pages/Settings";
import UserManagementPage from "./pages/UserManagement";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword"; // ✅ הוספת העמוד
import { ProtectedRoute } from "./context/auth-context";

function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/add" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />{" "}
          {/* ✅ כאן זה המקום הנכון */}
          {/* דפים מוגנים */}
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
