import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import MyWallet from "./pages/MyWallet";
import Profile from "./pages/Profile";
import { AlertProvider } from "./hooks/useAlert";

function App() {
  return (
    <Router>
      <AlertProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/wallet" element={<MyWallet />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </AlertProvider>
    </Router>
  );
}

export default App;
