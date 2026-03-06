'use client';

import React, { useState } from 'react';
import { Youtube } from 'lucide-react';

interface StreamSource {
    id: string;
    name: string;
    url: string;
}

const STREAMS: StreamSource[] = [
    { id: 'aljazeera', name: 'Al Jazeera', url: 'https://www.youtube.com/embed/gCNeDWCI0vo' }, // Example Live URL
    { id: 'lbci', name: 'LBCI', url: 'https://www.youtube.com/embed/WJ69rP_0V9c' },
    { id: 'aljadeed', name: 'Al Jadeed', url: 'https://www.youtube.com/embed/n3E8j2hMT94' },
    { id: 'mtv', name: 'MTV Lebanon', url: 'https://www.youtube.com/embed/c-p2r6z6rYQ' },
];

const StreamCard: React.FC = () => {
    const [activeSource, setActiveSource] = useState(STREAMS[0]);

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(255, 255, 255, 0.01)'
        }}>
            <div style={{
                padding: '10px 15px',
                borderBottom: '1px solid var(--border-glass)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.02)'
            }}>
                <h3 style={{
                    fontSize: '11px',
                    margin: 0,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center', gap: '8px'
                }}>
                    <Youtube size={12} color="var(--glow-red)" /> LIVE STREAM
                </h3>
                <span style={{ color: 'var(--glow-amber)', fontSize: '9px', fontWeight: 'bold' }}>{activeSource.name}</span>
            </div>

            <div style={{ padding: '8px', display: 'flex', gap: '6px', overflowX: 'auto', borderBottom: '1px solid var(--border-glass)' }}>
                {STREAMS.map(stream => (
                    <button
                        key={stream.id}
                        onClick={() => setActiveSource(stream)}
                        style={{
                            padding: '4px 8px',
                            fontSize: '9px',
                            textTransform: 'uppercase',
                            background: activeSource.id === stream.id ? 'var(--glow-cyan)' : 'rgba(255,255,255,0.05)',
                            color: activeSource.id === stream.id ? '#000' : 'var(--text-secondary)',
                            border: 'none',
                            borderRadius: '2px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            fontWeight: 'bold',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {stream.name}
                    </button>
                ))}
            </div>

            <div style={{ flex: 1, padding: '10px', background: '#000' }}>
                <iframe
                    width="100%"
                    height="100%"
                    src={activeSource.url}
                    title={`${activeSource.name} Live Stream`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    style={{ borderRadius: '2px' }}
                ></iframe>
            </div>
        </div>
    );
};

export default StreamCard;
