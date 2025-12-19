import React, { useState, useEffect, useRef } from 'react';

const FadeInSection = ({ children, delay = '0s' }) => {
    const [isVisible, setVisible] = useState(false);
    const domRef = useRef();

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    // Optional: unobserve if you only want it to run once
                    // observer.unobserve(entry.target);
                }
            });
        });

        if (domRef.current) {
            observer.observe(domRef.current);
        }

        return () => {
            if (domRef.current) observer.unobserve(domRef.current);
        };
    }, []);

    return (
        <div
            className={`fade-in-section ${isVisible ? 'is-visible' : ''}`}
            style={{ transitionDelay: delay }}
            ref={domRef}
        >
            {children}
        </div>
    );
};

export default FadeInSection;
