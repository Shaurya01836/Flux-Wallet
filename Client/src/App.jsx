import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import MyWallet from "./pages/MyWallet";
import Profile from "./pages/Profile";
import SplitWise from "./pages/SplitWise";
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
          <Route path="/split" element={<SplitWise />} />
        </Routes>
      </AlertProvider>
    </Router>
  );
}

export default App;
