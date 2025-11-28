import React from 'react';
import ReactDOM from 'react-dom/client';

const Popup = () => {
    return (
        <div style={{ width: '300px', padding: '16px' }}>
            <h1>Convex Panel</h1>
            <p>DevTools for Convex</p>
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Popup />
    </React.StrictMode>
);
