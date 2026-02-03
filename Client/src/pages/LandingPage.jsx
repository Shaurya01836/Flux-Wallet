import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google'; 
import axios from 'axios';
import { FaArrowRight, FaShieldAlt, FaChartPie, FaBolt, FaWallet, FaCheckCircle, FaGoogle } from 'react-icons/fa';
import api from '../api';

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('user_token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  // --- GOOGLE LOGIN LOGIC ---
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfo = await axios.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );

        const response = await api.post('/api/auth/google', {
             email: userInfo.data.email,
             name: userInfo.data.name,
             pictureUrl: userInfo.data.picture
        });

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

  const handleGetStarted = () => {
    const token = localStorage.getItem('user_token');
    if (token) {
      navigate('/dashboard');
    } else {
      handleGoogleLogin(); 
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      
      {/* --- Navbar --- */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-2xl tracking-tight">
          <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
            <FaBolt size={14} />
          </div>
          <span className="text-slate-900">Flux.</span>
        </div>
        <button 
            onClick={handleGetStarted}
            className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition"
        >
            Sign In
        </button>
      </nav>

      {/* --- Hero Section --- */}
      <div className="max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-2 gap-16 items-center">
        
        {/* Left: Content */}
        <div className="space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-wide">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Created By Shaurya Upadhyay
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
            Master your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
              money flow.
            </span>
          </h1>
          
          <p className="text-lg text-slate-500 leading-relaxed max-w-lg mx-auto lg:mx-0">
            Stop guessing where your money goes. Track, budget, and optimize your finances with a wallet built for clarity.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button
              onClick={handleGetStarted}
              className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3"
            >
              <FaGoogle className="text-white" /> 
              <span>Start with Google</span>
            </button>
            <button className="px-8 py-4 rounded-xl font-bold text-lg text-slate-600 hover:bg-slate-50 transition flex items-center justify-center gap-2">
                Learn more <FaArrowRight size={14} />
            </button>
          </div>
          
          <div className="flex items-center justify-center lg:justify-start gap-6 pt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
             <span className="flex items-center gap-1"><FaCheckCircle className="text-indigo-500" /> Free Forever</span>
             <span className="flex items-center gap-1"><FaCheckCircle className="text-indigo-500" /> No Credit Card</span>
          </div>
        </div>

        {/* Right: Modern Visual (Glass Dashboard) */}
        <div className="relative mt-12 lg:mt-0 perspective-1000">
            {/* Background Blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-100 to-blue-50 rounded-full blur-[80px] -z-10"></div>

            {/* Floating Card Container */}
            <div className="relative w-full max-w-md mx-auto bg-white rounded-[2rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden transform rotate-y-[-5deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-700 ease-out">
                
                {/* Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dashboard Preview</div>
                </div>

                {/* Body */}
                <div className="p-8 space-y-8">
                    {/* Balance */}
                    <div className="text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Balance</p>
                        <h2 className="text-4xl font-extrabold text-slate-900">$24,500.00</h2>
                        <div className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md text-xs font-bold">
                            <FaBolt size={10} /> +12% this month
                        </div>
                    </div>

                    {/* Chart Mockup */}
                    <div className="flex gap-2 items-end justify-center h-24 pb-2">
                        <div className="w-4 bg-indigo-100 rounded-t-sm h-12"></div>
                        <div className="w-4 bg-indigo-200 rounded-t-sm h-16"></div>
                        <div className="w-4 bg-indigo-500 rounded-t-sm h-20 shadow-lg shadow-indigo-200"></div>
                        <div className="w-4 bg-indigo-300 rounded-t-sm h-14"></div>
                        <div className="w-4 bg-indigo-100 rounded-t-sm h-10"></div>
                    </div>

                    {/* Transaction List Mock */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm"><FaWallet size={12} /></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800">Freelance</p>
                                    <p className="text-[10px] text-slate-400">Today, 10:00 AM</p>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-emerald-600">+$1,200</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-rose-500 shadow-sm"><FaChartPie size={12} /></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800">Netflix</p>
                                    <p className="text-[10px] text-slate-400">Yesterday</p>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-slate-900">-$14.00</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

      </div>

      {/* --- Features Grid --- */}
      <div className="bg-slate-50 py-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need to grow</h2>
                <p className="text-slate-500">Simple yet powerful features to help you manage your financial life without the complexity.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
                icon={<FaBolt />}
                title="Instant Logging"
                desc="Add transactions in seconds. Smart categories organize everything automatically."
            />
            <FeatureCard
                icon={<FaChartPie />}
                title="Smart Analytics"
                desc="Visualize your spending habits with beautiful, easy-to-read charts."
            />
            <FeatureCard
                icon={<FaShieldAlt />}
                title="Secure & Private"
                desc="Your data is encrypted. We never sell your personal information."
            />
            </div>
        </div>
      </div>

      {/* --- Footer --- */}
      <footer className="bg-white border-t border-slate-100 py-12">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-sm text-slate-400">
              <div className="flex items-center gap-2 mb-4 md:mb-0">
                  <span className="font-bold text-slate-900">Flux.</span>
                  <span>© 2026</span>
              </div>
              <div className="flex gap-6">
                  <a href="#" className="hover:text-indigo-600 transition">Privacy</a>
                  <a href="#" className="hover:text-indigo-600 transition">Terms</a>
                  <a href="#" className="hover:text-indigo-600 transition">Contact</a>
              </div>
          </div>
      </footer>

    </div>
  );
};

// Reusable Feature Card
const FeatureCard = ({ icon, title, desc }) => (
  <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 hover:-translate-y-1 transition-all duration-300">
    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl mb-6">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-sm text-slate-500 leading-relaxed">
      {desc}
    </p>
  </div>
);

export default LandingPage;