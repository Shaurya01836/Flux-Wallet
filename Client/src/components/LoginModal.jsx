import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';
import { FaBolt, FaTimes } from 'react-icons/fa';
import axios from 'axios';

const LoginModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSuccess = async (credentialResponse) => {
    try {
      // 1. Decode Google Token
      const decoded = jwtDecode(credentialResponse.credential);
      
      // 2. Send to Backend
      const response = await axios.post('http://localhost:8080/api/auth/google', {
          email: decoded.email,
          name: decoded.name,
          picture: decoded.picture
      });

      // 3. Get UserDTO
      const userDto = response.data;
      console.log("Logged In User:", userDto);

      // 4. Save Session
      localStorage.setItem('user_info', JSON.stringify(userDto));
      localStorage.setItem('user_token', credentialResponse.credential);

      // 5. DIRECT REDIRECT -> Dashboard (No checks)
      onClose();
      navigate('/dashboard');

    } catch (error) {
      console.error("Login Failed:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl relative animate-scale-up">
        
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500 transition"
        >
            <FaTimes />
        </button>

        <div className="w-16 h-16 bg-linear-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200 rotate-3">
          <FaBolt className="text-white text-3xl" />
        </div>

        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-gray-500 text-sm">Sign in securely to sync your wallet</p>
        </div>

        <div className="flex justify-center w-full mb-2">
            <GoogleLogin
                onSuccess={handleSuccess}
                onError={() => console.log('Login Failed')}
                theme="filled_blue"
                shape="pill"
                size="large"
                width="100%"
                text="continue_with"
            />
        </div>

        <div className="mt-6 text-xs text-center text-gray-400 leading-relaxed">
            By continuing, you agree to Flux's Terms of Service.
        </div>
      </div>
    </div>
  );
};

export default LoginModal;