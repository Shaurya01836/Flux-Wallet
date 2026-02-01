import React, { useState } from "react";
import { FaTimes, FaTrashAlt, FaSpinner, FaExclamationTriangle } from "react-icons/fa";

const DeleteTransactionModal = ({ isOpen, onClose, onConfirm }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    await onConfirm();
    setIsDeleting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-gray-900/40 backdrop-blur-md transition-all duration-300">
      
      {/* Modal Container */}
      <div className="bg-white w-full max-w-sm md:rounded-[2.5rem] rounded-t-[2.5rem] p-8 shadow-2xl relative animate-slide-up">
        
        {/* Close Button */}
        <button 
            onClick={onClose} 
            disabled={isDeleting}
            className="absolute top-6 right-6 p-2 text-gray-300 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-50"
        >
            <FaTimes size={18} />
        </button>

        <div className="flex flex-col items-center text-center">
            
            {/* Warning Icon */}
            <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-500 mb-6 shadow-sm">
               <FaTrashAlt size={32} />
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">
                Delete Transaction?
            </h2>
            
            <p className="text-gray-500 font-medium text-sm leading-relaxed mb-8 max-w-[80%]">
                Are you sure you want to remove this entry? This action cannot be undone.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 w-full">
                <button
                    onClick={handleConfirm}
                    disabled={isDeleting}
                    className={`
                        w-full py-4 rounded-2xl font-bold text-lg shadow-lg shadow-rose-100 transition-all duration-300 flex items-center justify-center gap-3
                        ${isDeleting 
                            ? 'bg-rose-100 text-rose-400 cursor-wait' 
                            : 'bg-rose-500 text-white hover:bg-rose-600 hover:scale-[1.02]'}
                    `}
                >
                    {isDeleting ? (
                        <>
                           <FaSpinner className="animate-spin" /> Deleting...
                        </>
                    ) : (
                        "Yes, Delete it"
                    )}
                </button>

                <button
                    onClick={onClose}
                    disabled={isDeleting}
                    className="w-full py-4 rounded-2xl font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteTransactionModal;