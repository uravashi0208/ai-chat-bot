import React from 'react';

const Loader = ({ fullPage = false }) => {
  return (
    <div className={`loader-container ${fullPage ? 'full-page' : ''}`}>
      <div className="loader"></div>
    </div>
  );
};

export default Loader;