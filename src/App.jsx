import { Routes, Route, Navigate } from "react-router-dom";

import AddTransaction from "./pages/AddTransaction";
import Transactions from "./pages/Transactions";
import SettingsPage from "./pages/Settings";
import UserManagementPage from "./pages/UserManagement";
import Layout from "./components/Layout";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/add" />} />
        <Route path="/add" element={<AddTransaction />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/users" element={<UserManagementPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
// בקובץ _app.jsx
import { AuthProvider } from "../context/auth-context";

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
