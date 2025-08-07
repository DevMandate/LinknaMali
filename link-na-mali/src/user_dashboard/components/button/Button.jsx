import React from 'react';

const Button = ({ children, onClick, className, type = 'button', variant = 'primary' }) => {
  const baseStyles = 'px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-200 ease-in-out';
  const variants = {
    primary: 'bg-primary-color text-white hover:bg-primary-dark focus:ring-primary-color',
    secondary: 'bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-500',
    success: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500',
  };

  const variantStyles = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyles} ${variantStyles} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;