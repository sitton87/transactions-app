// App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import AddTransaction from "./pages/AddTransaction";
import Transactions from "./pages/Transactions";
import SettingsPage from "./pages/Settings";
import UserManagementPage from "./pages/UserManagement";
import Layout from "./components/Layout";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/add" />} />
          <Route path="/add" element={<AddTransaction />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/users" element={<UserManagementPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
