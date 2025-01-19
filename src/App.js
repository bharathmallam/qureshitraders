import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./apis/Firebase";
import Login from "./pages/login/LoginPage";
import Navbar from "./navbar/Navbar";
import AccountManagement from "./pages/accounts/AccountManagement";
import EmployeeManagement from "./pages/employee/EmployeeManagement";
import What from "./pages/mediators/w";
//import MediatorManagement from "./pages/mediators/MediatorManagement";
import Settings from "./pages/settings/Settings";
import SupplierManagement from "./pages/suppliers/SupplierManagement";
import Salaries from "./pages/salaries/SalariesManagement";
import MediatorManagement from "./pages/mediators/MediatorManagemenet";
import RenewalsManagement from './pages/renewals/RenewalsManagement';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check the user's authentication status
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user); // Set login state
      setLoading(false); // Authentication check complete
    });

    // Cleanup the listener on component unmount
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsLoggedIn(false);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>; // Show a loading spinner or screen
  }

  return (
    <Router>
      <div>
        {/* Show Navbar if logged in */}
        {isLoggedIn && <Navbar onLogout={handleLogout} />}
        <Routes>
          {/* Redirect to accounts if logged in; otherwise, show login page */}
          <Route
            path="/"
            element={isLoggedIn ? <Navigate to="/accounts" /> : <Login />}
          />
          {isLoggedIn ? (
            <>
              {/* Protected Routes */}
              <Route path="/accounts" element={<AccountManagement />} />
              <Route path="/employees" element={<EmployeeManagement />} />
              <Route path="/salaries" element={<Salaries />} />
              <Route path="/mediator" element={<MediatorManagement />} />
              <Route path="/what" element={<What />} />
              <Route path="/supplier" element={<SupplierManagement />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/renewals" element={<RenewalsManagement />} />
            </>
          ) : (
            // Redirect unauthenticated users to the login page
            <Route path="*" element={<Navigate to="/" />} />
          )}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
