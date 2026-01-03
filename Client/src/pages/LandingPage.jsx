import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBolt, FaArrowRight } from 'react-icons/fa';
import LoginModal from '../components/LoginModal'; // <--- Import Modal

const LandingPage = () => {
  const navigate = useNavigate();
  const [isLoginOpen, setIsLoginOpen] = useState(false); // <--- State for Modal

  // Helper function to check login status
  const handleAuthAction = () => {
    const token = localStorage.getItem('user_token');
    if (token) {
        // If logged in, go straight to dashboard
        navigate('/dashboard');
    } else {
        // If not, open the popup
        setIsLoginOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      
      {/* Navbar */}
      <nav className="max-w-5xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-2xl">
            <FaBolt /> Flux
        </div>
       
        {/* Update Logic: Open Modal instead of Link */}
        <button 
            onClick={() => setIsLoginOpen(true)} 
            className="bg-gray-100 text-indigo-900 px-5 py-2 rounded-full font-semibold hover:bg-gray-200 transition"
        >
            Log In
        </button>
      </nav>

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-20 grid md:grid-cols-2 gap-12 items-center">
        
        {/* Left: Text */}
        <div className="space-y-6 text-center md:text-left">
            <div className="inline-block bg-indigo-50 text-indigo-600 px-4 py-1 rounded-full text-sm font-semibold mb-2">
                One of the best Wallet apps
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-gray-900">
                Manage your money <span className="text-indigo-600">without the headache.</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-md mx-auto md:mx-0">
                Track payments, analyze spending, and save more with the wallet that thinks like you do.
            </p>
            
            <div className="flex flex-col md:flex-row gap-4 pt-4 justify-center md:justify-start">
                {/* Update Logic: Check Auth before navigating */}
                <button 
                    onClick={handleAuthAction}
                    className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                >
                    Get Started <FaArrowRight />
                </button>
                <button className="bg-white border-2 border-gray-100 text-gray-700 px-8 py-4 rounded-xl font-bold text-lg hover:border-gray-300 transition">
                    Learn More
                </button>
            </div>
        </div>

        {/* Right: Visual */}
        <div className="relative mt-10 md:mt-0 flex justify-center">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-100 rounded-full blur-3xl opacity-50 z-0"></div>
            <div className="relative z-10 bg-white/80 backdrop-blur-xl border border-white/50 p-6 rounded-3xl shadow-2xl w-80 rotate-3 md:rotate-6">
                 <div className="flex justify-between items-center mb-8">
                    <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600"><FaBolt/></div>
                    <div className="text-xs font-bold text-gray-400">VISA</div>
                 </div>
                 <div className="text-2xl font-bold mb-1">$24,500.00</div>
                 <div className="text-sm text-gray-400 mb-8">Total Balance</div>
                 <div className="flex gap-2">
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 w-3/4"></div>
                    </div>
                 </div>
            </div>
        </div>
      </div>

      {/* Render the Modal at the bottom */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

    </div>
  );
};

export default LandingPage;