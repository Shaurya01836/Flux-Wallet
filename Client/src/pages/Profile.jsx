import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaCamera, FaSave, FaSignOutAlt, FaUser, FaPhone } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        phoneNumber: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
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
            const response = await api.put(`/api/user/${user.id}`, {
                username: formData.username,
                phoneNumber: formData.phoneNumber
            });

            const updatedUser = { ...user, ...response.data };
            localStorage.setItem('user_info', JSON.stringify(updatedUser));
            setUser(updatedUser);
            
            setMessage({ type: 'success', text: 'Saved successfully.' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            const errorMsg = error.response?.data || "Update failed.";
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        if (window.confirm("Log out of Flux?")) {
            localStorage.removeItem('user_info');
            localStorage.removeItem('user_token');
            navigate('/');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900">
            
            {/* --- Simple Navbar --- */}
            <div className="max-w-xl mx-auto px-6 py-6 flex items-center justify-between">
                <button 
                    onClick={() => navigate('/dashboard')} 
                    className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition"
                >
                    <FaArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-bold">Edit Profile</h1>
                <div className="w-8"></div> {/* Spacer to center title */}
            </div>

            <div className="max-w-md mx-auto px-6 pt-4">
                
                {/* --- Avatar & Basic Info --- */}
                <div className="text-center mb-10">
                    <div className="relative inline-block">
                        <img 
                            src={user.pictureUrl} 
                            alt={user.name} 
                            className="w-24 h-24 rounded-full object-cover border-4 border-gray-50 shadow-sm"
                        />
                        <div className="absolute bottom-0 right-0 bg-gray-900 text-white p-1.5 rounded-full border-2 border-white">
                            <FaCamera size={10} />
                        </div>
                    </div>
                    <h2 className="text-xl font-bold mt-4">{user.name}</h2>
                    <p className="text-gray-500 text-sm">{user.email}</p>
                    {user.createdAt && (
                        <p className="text-xs text-gray-400 mt-1">Joined {formatDate(user.createdAt)}</p>
                    )}
                </div>

                {/* --- Feedback Message --- */}
                {message && (
                    <div className={`mb-6 p-3 rounded-lg text-sm font-medium text-center ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {message.text}
                    </div>
                )}

                {/* --- Clean Form --- */}
                <form onSubmit={handleSave} className="space-y-6">
                    
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Username</label>
                        <div className="flex items-center border-b border-gray-200 py-2 focus-within:border-indigo-600 transition">
                            <FaUser className="text-gray-300 mr-3" />
                            <input 
                                type="text" 
                                name="username"
                                value={formData.username} 
                                onChange={handleChange} 
                                placeholder="@username"
                                className="w-full outline-none text-gray-900 font-medium placeholder-gray-300"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Phone Number</label>
                        <div className="flex items-center border-b border-gray-200 py-2 focus-within:border-indigo-600 transition">
                            <FaPhone className="text-gray-300 mr-3" />
                            <input 
                                type="tel" 
                                name="phoneNumber"
                                value={formData.phoneNumber} 
                                onChange={handleChange} 
                                placeholder="+1 000 000 0000"
                                className="w-full outline-none text-gray-900 font-medium placeholder-gray-300"
                            />
                        </div>
                    </div>

                    <div className="pt-6">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-black transition active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            {loading ? 'Saving...' : <><FaSave /> Save Changes</>}
                        </button>
                    </div>

                </form>

                {/* --- Logout (Separate Section) --- */}
                <div className="mt-10 pt-10 border-t border-gray-100 text-center">
                    <button 
                        onClick={handleLogout}
                        className="text-red-500 font-semibold text-sm hover:text-red-700 flex items-center justify-center gap-2 mx-auto transition"
                    >
                        <FaSignOutAlt /> Sign Out
                    </button>
            
                </div>

            </div>
        </div>
    );
};

export default Profile;