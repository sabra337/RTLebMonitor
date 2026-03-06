import React from 'react';
import { Maximize2 } from 'lucide-react';
import { format } from 'date-fns';
import { NewsItem, NewsCategory } from '@/types';

interface NewsCardProps {
    category: NewsCategory;
    title: string;
    items: NewsItem[];
    onExpand?: () => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ category, title, items, onExpand }) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minWidth: '0',
            background: 'rgba(255, 255, 255, 0.01)' /* Very subtle background */
        }}>
            <div style={{
                padding: '10px 15px',
                borderBottom: '1px solid var(--border-glass)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.03)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)' /* Shiny edge */
            }}>
                <h3 style={{
                    fontSize: '11px',
                    margin: 0,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--glow-cyan)', /* Primary title color */
                    opacity: 0.9
                }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 'normal' }}>N{category[0]}</span> {title}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--glow-green)', fontSize: '9px' }}>• LIVE</span>
                    <button
                        onClick={onExpand}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <Maximize2 size={12} />
                    </button>
                </div>
            </div>

            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '10px'
            }}>
                {items.length === 0 ? (
                    <div style={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        color: 'var(--text-secondary)',
                        textAlign: 'center'
                    }}>
                        No records in the selected time window.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {items.map((item) => (
                            <div key={item.id} style={{
                                borderLeft: '1px solid rgba(255,255,255,0.05)',
                                paddingLeft: '10px',
                                position: 'relative'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '9px', color: 'var(--glow-cyan)', fontWeight: 'bold' }}>
                                        {format(new Date(item.time), 'HH:mm')}
                                    </span>
                                    <span style={{ fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                        {item.source}
                                    </span>
                                </div>
                                <p style={{
                                    fontSize: '11px',
                                    margin: 0,
                                    lineHeight: '1.4',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                }}>
                                    {item.headline}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Decorative Corner / Radar detail */}
            <div style={{
                position: 'absolute',
                bottom: '5px',
                right: '5px',
                width: '15px',
                height: '15px',
                borderRight: '1px solid var(--border-glass)',
                borderBottom: '1px solid var(--border-glass)',
                opacity: 0.5,
                pointerEvents: 'none'
            }}></div>
        </div>
    );
};

export default NewsCard;
