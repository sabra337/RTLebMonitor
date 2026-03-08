'use client';

import React, { useState } from 'react';
import { Camera, Youtube } from 'lucide-react';
import { StreamSource } from '@/lib/streams';

interface StreamCardProps {
    streams?: StreamSource[];
    title?: string;
    icon?: 'youtube' | 'camera';
    accentColor?: string;
    variant?: 'single' | 'collage';
}

const StreamCard: React.FC<StreamCardProps> = ({
    streams = [],
    title = 'Live Stream',
    icon = 'youtube',
    accentColor = 'var(--glow-red)',
    variant = 'single'
}) => {
    const accentBorder = icon === 'camera' ? 'rgba(255, 170, 0, 0.26)' : 'rgba(255, 51, 51, 0.26)';
    const accentGlow = icon === 'camera' ? 'rgba(255, 170, 0, 0.18)' : 'rgba(255, 51, 51, 0.18)';
    const collageStreams = streams.slice(0, 4);

    const [activeSourceId, setActiveSourceId] = useState<string | null>(streams[0]?.id ?? null);
    const activeSource =
        streams.length === 0
            ? null
            : streams.find((stream) => stream.id === activeSourceId) ?? streams[0];
    const titleMeta = variant === 'collage' ? `${collageStreams.length} LIVE VIEWS` : activeSource?.name;
    const getPlayableUrl = (url: string): string => {
        try {
            const parsed = new URL(url);
            const host = parsed.hostname.toLowerCase();
            const isYouTube = host.includes('youtube.com') || host.includes('youtu.be');

            if (!isYouTube) {
                return url;
            }

            parsed.searchParams.set('autoplay', '1');
            parsed.searchParams.set('mute', '1');
            parsed.searchParams.set('playsinline', '1');
            parsed.searchParams.set('rel', '0');
            return parsed.toString();
        } catch {
            return url;
        }
    };

    if ((variant === 'single' && (!activeSource || streams.length === 0)) || (variant === 'collage' && collageStreams.length === 0)) {
        return (
            <div className="glass-card" style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)' }}>
                No stream sources available.
            </div>
        );
    }

    return (
        <div className="stream-card-shell" style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            minWidth: 0,
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))',
            border: `1px solid ${accentBorder}`,
            borderRadius: 'var(--card-radius)',
            overflow: 'hidden',
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 32px ${accentGlow}, 0 12px 30px rgba(0,0,0,0.35)`
        }}>
            <div style={{
                padding: '10px 15px',
                borderBottom: '1px solid var(--border-glass)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--card-header-bg)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                boxShadow: 'var(--card-header-shadow)',
                position: 'relative',
                zIndex: 2
            }}>
                <h3 style={{
                    fontSize: '11px',
                    margin: 0,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--text-primary)'
                }}>
                    {icon === 'camera' ? (
                        <Camera size={12} color={accentColor} />
                    ) : (
                        <Youtube size={12} color={accentColor} />
                    )}
                    {title}
                </h3>
                <span style={{ color: 'rgba(255,255,255,0.72)', fontSize: '9px', fontWeight: 'bold' }}>{titleMeta}</span>
            </div>

            {variant === 'single' && activeSource ? (
                <div style={{ padding: '8px', display: 'flex', gap: '6px', overflowX: 'auto', borderBottom: '1px solid var(--border-glass)', background: 'rgba(5, 6, 8, 0.36)', position: 'relative', zIndex: 2 }}>
                    {streams.map(stream => (
                        <button
                            key={stream.id}
                            onClick={() => setActiveSourceId(stream.id)}
                            style={{
                                padding: '4px 8px',
                                fontSize: '9px',
                                textTransform: 'uppercase',
                                background: activeSource.id === stream.id ? 'var(--glow-cyan)' : 'rgba(255,255,255,0.08)',
                                color: activeSource.id === stream.id ? '#000' : 'var(--text-secondary)',
                                border: '1px solid rgba(255,255,255,0.08)',
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
            ) : null}

            <div style={{
                flex: 1,
                minHeight: 0,
                padding: '10px',
                background: 'rgba(5, 6, 8, 0.38)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
                zIndex: 1
            }}>
                {variant === 'collage' ? (
                    <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gridTemplateRows: '1fr 1fr',
                        gap: '0',
                        border: '1px solid rgba(255,255,255,0.12)',
                        position: 'relative'
                    }}>
                        {collageStreams.map((stream) => (
                            <div key={stream.id} style={{
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: '0 0 24px rgba(0,0,0,0.45)'
                            }}>
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={getPlayableUrl(stream.url)}
                                    title={`${stream.name} Live Stream`}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                ></iframe>
                                <div style={{
                                    position: 'absolute',
                                    left: '0',
                                    right: '0',
                                    bottom: '0',
                                    padding: '8px 10px',
                                    fontSize: '9px',
                                    fontWeight: 'bold',
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                    color: 'rgba(255,255,255,0.86)',
                                    background: 'linear-gradient(180deg, transparent, rgba(4, 6, 8, 0.9))'
                                }}>
                                    {stream.name}
                                </div>
                            </div>
                        ))}
                        <div style={{
                            position: 'absolute',
                            top: '0',
                            bottom: '0',
                            left: '50%',
                            width: '1px',
                            transform: 'translateX(-0.5px)',
                            background: 'rgba(255,255,255,0.12)',
                            pointerEvents: 'none'
                        }} />
                        <div style={{
                            position: 'absolute',
                            left: '0',
                            right: '0',
                            top: '50%',
                            height: '1px',
                            transform: 'translateY(-0.5px)',
                            background: 'rgba(255,255,255,0.12)',
                            pointerEvents: 'none'
                        }} />
                    </div>
                ) : (
                    <div style={{
                        width: '100%',
                        height: '100%',
                        maxWidth: 'none',
                        maxHeight: 'none',
                        aspectRatio: 'auto',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.12)',
                        boxShadow: '0 0 24px rgba(0,0,0,0.45)'
                    }}>
                        <iframe
                            width="100%"
                            height="100%"
                            src={getPlayableUrl(activeSource!.url)}
                            title={`${activeSource!.name} Live Stream`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        ></iframe>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StreamCard;
