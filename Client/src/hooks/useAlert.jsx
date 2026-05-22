import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaQuestionCircle, FaEdit, FaTimes, FaTrashAlt, FaSignOutAlt } from "react-icons/fa";

const AlertContext = createContext(null);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info", // "success" | "error" | "warning" | "info" | "confirm" | "prompt"
    defaultValue: "",
    placeholder: "",
    resolvePromise: null,
  });

  const [promptValue, setPromptValue] = useState("");
  const inputRef = useRef(null);

  // Focus input when prompt opens
  useEffect(() => {
    if (modalState.isOpen && modalState.type === "prompt" && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [modalState.isOpen, modalState.type]);

  const showAlert = (message, title = "Notification", type = "info") => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        type,
        defaultValue: "",
        placeholder: "",
        resolvePromise: resolve,
      });
    });
  };

  const showConfirm = (message, title = "Are you sure?", type = "confirm") => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        type,
        defaultValue: "",
        placeholder: "",
        resolvePromise: resolve,
      });
    });
  };

  const showPrompt = (message, defaultValue = "", title = "Enter Value") => {
    setPromptValue(defaultValue);
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        type: "prompt",
        defaultValue,
        placeholder: "Type here...",
        resolvePromise: resolve,
      });
    });
  };

  const handleConfirm = () => {
    if (!modalState.isOpen) return;
    const { resolvePromise, type } = modalState;
    
    setModalState((prev) => ({ ...prev, isOpen: false }));
    
    if (resolvePromise) {
      if (type === "prompt") {
        resolvePromise(promptValue);
      } else if (type === "confirm") {
        resolvePromise(true);
      } else {
        resolvePromise(true);
      }
    }
  };

  const handleCancel = () => {
    if (!modalState.isOpen) return;
    const { resolvePromise, type } = modalState;
    
    setModalState((prev) => ({ ...prev, isOpen: false }));
    
    if (resolvePromise) {
      if (type === "confirm") {
        resolvePromise(false);
      } else if (type === "prompt") {
        resolvePromise(null);
      } else {
        resolvePromise(false);
      }
    }
  };

  // Intercept native dialogs globally
  useEffect(() => {
    window.alert = (message) => {
      let type = "info";
      let title = "Notification";
      
      const lower = message.toLowerCase();
      if (lower.includes("fail") || lower.includes("error") || lower.includes("wrong")) {
        type = "error";
        title = "Error Occurred";
      } else if (lower.includes("success") || lower.includes("saved") || lower.includes("done")) {
        type = "success";
        title = "Success";
      }
      
      return showAlert(message, title, type);
    };

    window.confirm = (message) => {
      const lower = message.toLowerCase();
      let type = "confirm";
      let title = "Confirm Action";
      
      if (lower.includes("delete") || lower.includes("remove") || lower.includes("clear")) {
        type = "danger";
        title = "Delete?";
      } else if (lower.includes("logout") || lower.includes("log out") || lower.includes("sign out") || lower.includes("signout")) {
        type = "danger";
        title = "Log Out?";
      }
      
      return showConfirm(message, title, type);
    };

    window.prompt = (message, defaultValue = "") => {
      return showPrompt(message, defaultValue, "Input Required");
    };
  }, []);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!modalState.isOpen) return;
      
      if (e.key === "Escape") {
        handleCancel();
      } else if (e.key === "Enter" && modalState.type !== "prompt") {
        e.preventDefault();
        handleConfirm();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalState.isOpen, modalState.type, promptValue, modalState.resolvePromise]);

  // Icon container color class based on type
  const getIconContainerClass = () => {
    switch (modalState.type) {
      case "success":
        return "bg-emerald-50 text-emerald-500";
      case "error":
      case "danger":
        return "bg-rose-50 text-rose-500";
      case "warning":
        return "bg-amber-50 text-amber-500";
      default:
        return "bg-indigo-50 text-indigo-600";
    }
  };

  // Render SVG icon based on type
  const renderIcon = () => {
    const isLogout = modalState.title.toLowerCase().includes("log out") || modalState.message.toLowerCase().includes("log out");
    switch (modalState.type) {
      case "success":
        return <FaCheckCircle size={32} />;
      case "error":
        return <FaExclamationTriangle size={32} />;
      case "danger":
        return isLogout ? <FaSignOutAlt size={32} /> : <FaTrashAlt size={32} />;
      case "warning":
        return <FaExclamationTriangle size={32} />;
      case "confirm":
        return <FaQuestionCircle size={32} />;
      case "prompt":
        return <FaEdit size={32} />;
      default:
        return <FaInfoCircle size={32} />;
    }
  };

  // Get primary button style dynamically based on type
  const getPrimaryButtonClass = () => {
    switch (modalState.type) {
      case "success":
        return "bg-emerald-500 hover:bg-emerald-600 hover:scale-[1.02] shadow-lg shadow-emerald-100 text-white";
      case "error":
      case "danger":
        return "bg-rose-500 hover:bg-rose-600 hover:scale-[1.02] shadow-lg shadow-rose-100 text-white";
      case "warning":
        return "bg-amber-500 hover:bg-amber-600 hover:scale-[1.02] shadow-lg shadow-amber-100 text-white";
      default:
        return "bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] shadow-lg shadow-indigo-100 text-white";
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}

      {/* Stunning custom alert/confirm/prompt overlay */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-gray-900/40 backdrop-blur-md transition-all duration-300 animate-fade-in">
          {/* Backdrop Closer */}
          <div className="absolute inset-0 cursor-default" onClick={handleCancel} />

          {/* Modal Container: Matches DeleteTransactionModal styling perfectly */}
          <div className="bg-white w-full max-w-sm md:rounded-[2.5rem] rounded-t-[2.5rem] p-8 shadow-2xl relative animate-slide-up">
            
            {/* Elegant Close Button */}
            <button
              onClick={handleCancel}
              className="absolute top-6 right-6 p-2 text-gray-300 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-50 transition-all active:scale-90"
              aria-label="Close modal"
            >
              <FaTimes size={18} />
            </button>

            <div className="flex flex-col items-center text-center">
              
              {/* Status Icon */}
              <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm ${getIconContainerClass()}`}>
                {renderIcon()}
              </div>

              {/* Title */}
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">
                {modalState.title}
              </h2>

              {/* Message */}
              <p className="text-gray-500 font-medium text-sm leading-relaxed mb-8 max-w-[80%] break-words">
                {modalState.message}
              </p>

              {/* Input for Prompt Modal */}
              {modalState.type === "prompt" && (
                <input
                  ref={inputRef}
                  type="text"
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleConfirm();
                    }
                  }}
                  placeholder={modalState.placeholder}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 font-bold text-gray-950 outline-none focus:bg-white focus:ring-2 focus:ring-gray-100 transition-all text-center mb-6 placeholder-gray-400"
                />
              )}

              {/* Actions Buttons */}
              <div className="flex flex-col gap-3 w-full">
                {(modalState.type === "confirm" || modalState.type === "prompt" || modalState.type === "danger" || modalState.type === "warning") ? (
                  <>
                    <button
                      onClick={handleConfirm}
                      className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center ${getPrimaryButtonClass()}`}
                    >
                      {modalState.type === "danger" 
                        ? ((modalState.title.toLowerCase().includes("log out") || modalState.message.toLowerCase().includes("log out")) ? "Yes, Log Out" : "Yes, Delete it") 
                        : "Confirm"}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="w-full py-4 rounded-2xl font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleConfirm}
                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center ${getPrimaryButtonClass()}`}
                  >
                    Got It
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};
