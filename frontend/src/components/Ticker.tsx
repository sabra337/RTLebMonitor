'use client';

import React from 'react';

const Ticker: React.FC = () => {
    const alerts = [
        "CRITICAL: Blood type O- urgently needed at AUBMC.",
        "Baalbek residential area under new evacuation warning.",
        "3 shelter locations now accepting displaced families in Beirut.",
        "DISCLAIMER: This platform provides informational visualization only. Always follow official emergency guidance."
    ];

    return (
        <div className="glass-panel" style={{
            width: '100%',
            height: '30px',
            fontSize: '11px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            borderLeft: 'none',
            borderRight: 'none',
            borderTop: 'none',
            background: 'rgba(255, 51, 51, 0.05)',
            color: 'var(--glow-red)',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            position: 'relative'
        }}>
            <div className="ticker-content" style={{
                whiteSpace: 'nowrap',
                display: 'flex',
                gap: '50px',
                animation: 'ticker 30s linear infinite',
                paddingLeft: '100%'
            }}>
                {alerts.concat(alerts).map((alert, i) => (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ opacity: 0.5 }}>•</span> {alert}
                    </span>
                ))}
            </div>

            <style jsx>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        .ticker-content:hover {
          animation-play-state: paused;
        }
      `}</style>
        </div>
    );
};

export default Ticker;
