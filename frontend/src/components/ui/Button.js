import React from 'react';

const Button = ({ children, onClick, type = 'button', variant = 'primary' }) => {
  const buttonClass = `btn btn-${variant}`;
  
  return (
    <button type={type} className={buttonClass} onClick={onClick}>
      {children}
    </button>
  );
};

export default Button;