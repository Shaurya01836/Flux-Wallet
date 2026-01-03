import React from 'react';
import { FaPlus, FaArrowLeft, FaCreditCard, FaLock, FaWifi } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const MyWallet = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-4xl p-6 md:p-10">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/dashboard')} className="p-3 bg-white rounded-full shadow-sm hover:bg-gray-100 transition">
            <FaArrowLeft className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">My Cards</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          
          {/* Left: Card Display */}
          <div className="space-y-6">
            {/* The Credit Card UI */}
            <div className="relative h-56 bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-600 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-200 overflow-hidden">
               {/* Decorative Circles */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
               <div className="absolute bottom-0 left-0 w-40 h-40 bg-white opacity-5 rounded-full -ml-10 -mb-10"></div>
               
               <div className="relative z-10 flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start">
                    <div>
                        <p className="text-indigo-200 text-xs font-semibold tracking-widest uppercase">Current Balance</p>
                        <h2 className="text-2xl font-bold mt-1">$12,403.00</h2>
                    </div>
                    <FaWifi className="text-2xl opacity-80 rotate-90" />
                  </div>

                  <div className="flex items-center gap-4 mt-4">
                     <div className="w-12 h-8 bg-yellow-400 rounded-md opacity-90"></div> {/* Chip */}
                     <FaWifi className="rotate-90 text-xl opacity-50" />
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                        <p className="text-indigo-200 text-xs tracking-widest mb-1">CARD HOLDER</p>
                        <p className="font-semibold tracking-wider">JOHN DOE</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold tracking-widest">**** 4288</p>
                        <p className="text-xs text-indigo-200">09/28</p>
                    </div>
                  </div>
               </div>
            </div>

            {/* Card Actions */}
            <div className="grid grid-cols-3 gap-4">
               <CardAction icon={<FaLock />} label="Freeze" />
               <CardAction icon={<FaCreditCard />} label="Details" />
               <CardAction icon={<FaPlus />} label="Add New" active />
            </div>
          </div>

          {/* Right: Payment Limits / Settings */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
             <h3 className="font-bold text-gray-900 mb-6">Card Settings</h3>
             
             <div className="space-y-6">
                <SettingRow label="Online Payments" desc="Allow payments on websites" active />
                <SettingRow label="ATM Withdrawals" desc="Allow cash withdrawals" active />
                <SettingRow label="International" desc="Allow payments abroad" active={false} />
             </div>

             <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex justify-between mb-2">
                    <span className="text-sm font-bold text-gray-700">Spending Limit</span>
                    <span className="text-sm font-bold text-indigo-600">$1,200 / $5,000</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full w-1/4"></div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const CardAction = ({ icon, label, active }) => (
    <button className={`flex flex-col items-center justify-center p-4 rounded-2xl transition border ${active ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-600 hover:text-indigo-600'}`}>
        <div className="text-xl mb-2">{icon}</div>
        <span className="text-xs font-bold">{label}</span>
    </button>
);

const SettingRow = ({ label, desc, active }) => (
    <div className="flex justify-between items-center">
        <div>
            <p className="font-bold text-gray-800">{label}</p>
            <p className="text-xs text-gray-400">{desc}</p>
        </div>
        <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${active ? 'bg-indigo-600' : 'bg-gray-200'}`}>
            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${active ? 'translate-x-6' : ''}`}></div>
        </div>
    </div>
);

export default MyWallet;