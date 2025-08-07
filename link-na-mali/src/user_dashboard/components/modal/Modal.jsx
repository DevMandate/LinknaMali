import React from 'react';

const Modal = ({ show, onClose, children }) => {
  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full mx-4">
        {children}
        <div className="flex justify-end mt-6">
          <button 
            onClick={onClose} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;