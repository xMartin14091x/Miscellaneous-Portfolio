import React from 'react';

const Footer = () => {
    const footerStyles = {
        padding: '40px 20px',
        backgroundColor: '#0f172a',
        color: '#64748b',
        textAlign: 'center',
        borderTop: '1px solid #1e293b',
    };

    return (
        <footer style={footerStyles}>
            <div className="container">
                <p style={{ marginBottom: '10px', color: '#fff', fontWeight: 600 }}>NuclearCity Project</p>
                <p>© 2025 Future Energy Initiative. Demonstrating a cleaner tomorrow.</p>
            </div>
        </footer>
    );
};

export default Footer;
