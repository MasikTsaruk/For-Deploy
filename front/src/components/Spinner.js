import React from 'react';
import '../styles/Spinner.css';

function Spinner({ size = 'medium' }) {
    return <div className={`spinner ${size}`} />;
}

export default Spinner;
