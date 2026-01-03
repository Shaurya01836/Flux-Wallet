import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaCamera, FaSave, FaUser, FaPhone, FaEnvelope } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../api';

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        phoneNumber: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null); // For success/error messages

    useEffect(() => {
        // Load user from local storage
        const storedUser = JSON.parse(localStorage.getItem('user_info'));
        if (storedUser) {
            setUser(storedUser);
            setFormData({
                username: storedUser.username || '',
                phoneNumber: storedUser.phoneNumber || ''
            });
        } else {
            navigate('/');
        }
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            // Send PUT request to backend
          const response = await api.put(`/api/user/${user.id}`, {
                username: formData.username,
                phoneNumber: formData.phoneNumber
            });

            // Update Local Storage with new data
            const updatedUser = { ...user, ...response.data };
            localStorage.setItem('user_info', JSON.stringify(updatedUser));
            setUser(updatedUser);
            
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            console.error("Update failed", error);
            // Extract error message from backend if available
            const errorMsg = error.response?.data || "Failed to update profile. Username might be taken.";
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex justify-center p-4 font-sans">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden animate-fade-in relative">
                
                {/* Header / Cover */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-40 relative">
                    <button 
                        onClick={() => navigate('/dashboard')} 
                        className="absolute top-6 left-6 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition"
                    >
                        <FaArrowLeft />
                    </button>
                </div>

                {/* Avatar & Info */}
                <div className="px-8 pb-8">
                    <div className="relative -mt-16 mb-6 flex justify-center">
                        <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200">
                             {/* Show Google Picture */}
                             <img src={user.pictureUrl} alt={user.name} className="w-full h-full object-cover" />
                        </div>
                        {/* Optional: Camera Icon (Visual only for now) */}
                        <div className="absolute bottom-2 right-1/2 translate-x-12 bg-gray-900 text-white p-2 rounded-full border-2 border-white shadow-sm cursor-pointer hover:bg-gray-800">
                            <FaCamera size={12} />
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                        <p className="text-gray-500 text-sm flex items-center justify-center gap-2 mt-1">
                             <FaEnvelope className="text-gray-400" /> {user.email}
                        </p>
                    </div>

                    {/* Feedback Message */}
                    {message && (
                        <div className={`mb-6 p-3 rounded-xl text-sm font-medium text-center ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                            {message.text}
                        </div>
                    )}

                    {/* Edit Form */}
                    <form onSubmit={handleSave} className="space-y-5">
                        <div className="relative">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Username</label>
                            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-indigo-500 focus-within:bg-white transition">
                                <FaUser className="text-gray-400 mr-3" />
                                <input 
                                    type="text" 
                                    name="username"
                                    value={formData.username} 
                                    onChange={handleChange}
                                    placeholder="@username"
                                    className="w-full bg-transparent outline-none font-medium text-gray-800"
                                />
                            </div>
                        </div>

                        <div className="relative">
                             <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Phone Number</label>
                             <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-indigo-500 focus-within:bg-white transition">
                                <FaPhone className="text-gray-400 mr-3" />
                                <input 
                                    type="tel" 
                                    name="phoneNumber"
                                    value={formData.phoneNumber} 
                                    onChange={handleChange}
                                    placeholder="+1 234 567 890"
                                    className="w-full bg-transparent outline-none font-medium text-gray-800"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? 'Saving...' : <><FaSave /> Save Changes</>}
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
};

export default Profile;