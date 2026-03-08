'use client';

import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';

const TopBar: React.FC = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <header style={{
            width: '100%',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div className="glass-panel announcement-bar">
                <div className="announcement-track">
                    {[
                        "This is a monitoring dashboard, always check the resources for misinformation",
                        "This is a monitoring dashboard, always check the resources for misinformation",
                    ].map((message, index) => (
                        <span key={index} className="announcement-item">
                            <span className="announcement-dot">•</span>
                            {message}
                        </span>
                    ))}
                </div>
            </div>

            <nav className="glass-panel nav-header" style={{
                padding: '12px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderLeft: 'none',
                borderRight: 'none',
                borderRadius: '0'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: '2px double var(--glow-amber)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontSize: '20px'
                    }}>
                        ◎
                    </div>
                    <div>
                        <h1 style={{
                            fontSize: '22px',
                            fontWeight: 900,
                            letterSpacing: '0.15em',
                            margin: 0,
                            textTransform: 'uppercase'
                        }}>
                            LEBANON <span style={{ color: 'var(--glow-amber)' }}>MONITOR</span>
                        </h1>
                        <p style={{
                            fontSize: '9px',
                            color: 'var(--text-secondary)',
                            letterSpacing: '0.3em',
                            margin: 0,
                            textTransform: 'uppercase'
                        }}>
                            Live Situational Awareness Platform
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    {/* Status Indicators Removed as per request */}
                </div>

                <div style={{ textAlign: 'right', minWidth: '140px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                        {format(time, 'HH:mm:ss')}
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        {format(time, 'EEE, MMM d, yyyy')} • Beirut Local
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default TopBar;
