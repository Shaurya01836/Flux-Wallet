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
    const [imgError, setImgError] = useState(false);

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
        <div className="min-h-screen bg-[#06080F] font-sans text-gray-900 selection:bg-indigo-500/30 overflow-hidden relative">

            {/* Ambient Background Glows */}
            <div className="absolute top-[-50px] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute top-[350px] right-[-10%] w-[400px] h-[400px] bg-rose-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            {/* --- Dark Header Section --- */}
            <div className="pt-6 pb-20 px-5 md:pt-10 relative z-10">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 -ml-2 text-indigo-200/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                    >
                        <FaArrowLeft size={18} />
                    </button>
                    <h1 className="text-xl font-bold tracking-widest uppercase text-white">Profile</h1>
                    <div className="w-9"></div> {/* Spacer to center title */}
                </div>
            </div>

            {/* --- Light Body Section --- */}
            <div className="bg-white min-h-screen rounded-t-[2.5rem] relative mt-[-2.5rem] px-5 pt-0 pb-24 shadow-[0_-15px_40px_rgba(0,0,0,0.3)] z-20">
                <div className="max-w-lg mx-auto">

                    {/* --- Avatar & Basic Info --- */}
                    <div className="text-center mb-8 relative z-10 pt-4 mt-[-4rem]">
                        <div className="relative inline-block mb-4">
                            {user.pictureUrl && !imgError ? (
                                <img
                                    src={user.pictureUrl}
                                    alt={user.name}
                                    className="w-28 h-28 rounded-3xl object-cover border-4 border-white shadow-lg"
                                    referrerPolicy="no-referrer"
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <div className="w-28 h-28 rounded-3xl border-4 border-white shadow-lg bg-indigo-600 flex items-center justify-center text-4xl text-white font-bold">
                                    {user.name?.[0] || 'U'}
                                </div>
                            )}
                            <div className="absolute -bottom-3 -right-3 bg-indigo-600 text-white p-2.5 rounded-2xl border-4 border-white shadow-md hover:bg-indigo-500 hover:scale-110 transition-transform cursor-pointer">
                                <FaCamera size={14} />
                            </div>
                        </div>
                        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">{user.name}</h2>
                        <p className="text-gray-500 text-sm font-medium mt-1 tracking-wide">{user.email}</p>
                        {user.createdAt && (
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-3 font-bold">Joined {formatDate(user.createdAt)}</p>
                        )}
                    </div>

                    {/* --- Feedback Message --- */}
                    {message && (
                        <div className={`mb-8 p-4 rounded-2xl text-sm font-bold text-center border shadow-sm relative z-10 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                            {message.text}
                        </div>
                    )}

                    {/* --- Clean Form --- */}
                    <form onSubmit={handleSave} className="space-y-6 relative z-10 px-2">

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Username</label>
                            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 focus-within:border-indigo-500 focus-within:bg-white transition-all shadow-sm">
                                <FaUser className="text-gray-400 mr-4" />
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="@username"
                                    className="w-full bg-transparent outline-none text-gray-900 font-bold placeholder-gray-400"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Phone Number</label>
                            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 focus-within:border-indigo-500 focus-within:bg-white transition-all shadow-sm">
                                <FaPhone className="text-gray-400 mr-4" />
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    placeholder="+1 000 000 0000"
                                    className="w-full bg-transparent outline-none text-gray-900 font-bold placeholder-gray-400"
                                />
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2 shadow-[0_10px_25px_rgba(79,70,229,0.3)] hover:shadow-[0_15px_30px_rgba(79,70,229,0.4)] text-sm tracking-widest uppercase"
                            >
                                {loading ? 'Saving...' : <><FaSave /> Save Changes</>}
                            </button>
                        </div>
                    </form>

                    {/* --- Logout Section --- */}
                    <div className="mt-8 text-center relative z-10">
                        <button
                            onClick={handleLogout}
                            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-bold text-xs uppercase tracking-widest py-3 px-6 rounded-2xl flex items-center justify-center gap-2 mx-auto transition-all border border-transparent hover:border-rose-100"
                        >
                            <FaSignOutAlt size={14} /> Sign Out
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Profile;