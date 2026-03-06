import React from 'react';

interface StatusChipProps {
    label: string;
    type: 'live' | 'warning' | 'operational' | 'alert';
    value?: string | number;
}

const StatusChip: React.FC<StatusChipProps> = ({ label, type, value }) => {
    const getColors = () => {
        switch (type) {
            case 'live':
                return { color: 'var(--glow-red)', border: 'glow-border-red' };
            case 'warning':
                return { color: 'var(--glow-amber)', border: 'glow-border-amber' };
            case 'operational':
                return { color: 'var(--glow-green)', border: 'glow-border-green' };
            case 'alert':
                return { color: 'var(--glow-cyan)', border: 'glow-border-cyan' };
            default:
                return { color: 'var(--text-secondary)', border: 'border-glass' };
        }
    };

    const { color, border } = getColors();

    return (
        <div className={`glass-panel ${border}`} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            height: '28px'
        }}>
            <span className="status-pulsing" style={{ color }}>
                {label}
            </span>
            {value !== undefined && (
                <span style={{ fontWeight: 'bold', color: 'white', marginLeft: '4px' }}>
                    {value}
                </span>
            )}
        </div>
    );
};

export default StatusChip;
