import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google'; 
import axios from 'axios';
import { FaBolt, FaArrowRight, FaGoogle, FaCheckCircle, FaShieldAlt, FaChartPie, FaChevronDown, FaArrowDown, FaArrowUp } from 'react-icons/fa'; // Added FaGoogle
import api from '../api';

const LandingPage = () => {
  const navigate = useNavigate();

  
  useEffect(() => {
    const token = localStorage.getItem('user_token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  // --- 2. THE NEW SMART LOGIN FUNCTION ---
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // 1. Get User Info from Google directly using the Access Token
        const userInfo = await axios.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );

        // 2. Send to your Backend (Same as LoginModal)
        const response = await api.post('/api/auth/google', {
             email: userInfo.data.email,
             name: userInfo.data.name,
             pictureUrl: userInfo.data.picture
        });

        // 3. Save & Redirect
        localStorage.setItem('user_token', response.data.token);
        localStorage.setItem('user_info', JSON.stringify(response.data));
        navigate('/dashboard');

      } catch (error) {
        console.error("Login failed", error);
        alert("Login failed. Please try again.");
      }
    },
    onError: () => console.log('Login Failed'),
  });

  // Wrapper function to check auth state first
  const handleGetStarted = () => {
    const token = localStorage.getItem('user_token');
    if (token) {
      navigate('/dashboard');
    } else {
      handleGoogleLogin(); 
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
      
      {/* Minimal Navbar */}
      <nav className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-2xl tracking-tight">
          <FaBolt /> Flux
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-20 grid md:grid-cols-2 gap-12 items-center">
        
        {/* Left: Text */}
        <div className="space-y-6 text-center md:text-left">
          <div className="inline-block bg-indigo-50 text-indigo-600 px-4 py-1 rounded-full text-sm font-semibold mb-2">
            One of the best Wallet apps
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-gray-900">
            Manage your money{" "}
            <span className="text-indigo-600">without the headache.</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-md mx-auto md:mx-0">
            Track payments, analyze spending, and save more with the wallet that
            thinks like you do.
          </p>

          <div className="flex flex-col md:flex-row gap-4 pt-4 justify-center md:justify-start">
            
            {/* --- UPDATED BUTTON --- */}
            <button
              onClick={handleGetStarted}
              className="bg-gray-900 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-gray-200 hover:bg-black hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3"
            >
              {/* Google Icon to indicate "Smart Login" */}
              <FaGoogle className="text-white/80" /> 
              <span>Continue with Google</span>
              <FaArrowRight className="text-sm opacity-70" />
            </button>
            
          </div>
          <p className="text-xs text-gray-400 font-medium">
             Secure Access • No Credit Card Required
          </p>
        </div>

        {/* Right: Modern Visual */}
        <div className="relative mt-12 md:mt-0 flex justify-center md:justify-end" style={{ perspective: '1000px' }}>
            {/* 1. Background Glow Blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/20 rounded-full blur-[80px] -z-10 animate-pulse"></div>

            {/* 2. Main Glassmorphism Card */}
            <div className="relative z-10 w-72 md:w-80 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6 rounded-3xl shadow-2xl transform rotate-y-12 rotate-x-6 hover:rotate-0 transition-transform duration-500 border border-gray-700/50">
                <div className="flex justify-between items-center mb-8">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 shadow-inner">
                        <FaBolt className="text-indigo-400" />
                    </div>
                    <span className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Flux Platinum</span>
                </div>
                <div className="mb-8">
                    <p className="text-gray-400 text-xs font-medium mb-1 tracking-wide">Total Balance</p>
                    <h3 className="text-3xl font-bold tracking-tight text-white">$24,500.00</h3>
                </div>
                <div className="flex justify-between items-end">
                    <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    </div>
                    <div className="text-right">
                        <p className="font-mono text-sm text-gray-300">**** 4288</p>
                        <p className="text-[10px] text-gray-500">EXP 09/28</p>
                    </div>
                </div>
            </div>

            
        </div>

      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<FaCheckCircle />}
            title="Simple Tracking"
            desc="Log income and expenses in seconds. No complicated forms."
          />
          <FeatureCard
            icon={<FaChartPie />}
            title="Visual Insights"
            desc="Beautiful charts that show you exactly where your money is going."
          />
          <FeatureCard
            icon={<FaShieldAlt />}
            title="Bank-Grade Security"
            desc="Your data is encrypted and secure. We value your privacy."
          />
        </div>
      </div>

    </div>
  );
};

// Simple reusable component for features
const FeatureCard = ({ icon, title, desc }) => (
  <div className="bg-gray-50 hover:bg-white p-8 rounded-3xl border border-transparent hover:border-gray-100 cursor-pointer transition-all duration-300 group">
    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-xl mb-6 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 leading-relaxed">{desc}</p>
  </div>
);

export default LandingPage;