import React from 'react';
import { Maximize2 } from 'lucide-react';
import { format } from 'date-fns';
import { NewsItem, NewsCategory } from '@/types';

interface NewsCardProps {
    category: NewsCategory;
    title: string;
    items: NewsItem[];
    isLoading?: boolean;
    visibleItems?: number;
    onExpand?: () => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ category, title, items, isLoading = false, visibleItems = 5, onExpand }) => {
    const CARD_ROW_MIN_HEIGHT = 64;
    const CARD_ROW_GAP = 12;
    const listMaxHeight = visibleItems * CARD_ROW_MIN_HEIGHT + (visibleItems - 1) * CARD_ROW_GAP;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minWidth: '0',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            borderRadius: 'var(--card-radius)',
            overflow: 'hidden',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 12px 30px rgba(0,0,0,0.35)'
        }}>
            <div style={{
                padding: '10px 15px',
                borderBottom: '1px solid var(--border-glass)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--card-header-bg)',
                boxShadow: 'var(--card-header-shadow)'
            }}>
                <h3 style={{
                    fontSize: '11px',
                    margin: 0,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'rgba(255,255,255,0.94)'
                }}>
                    <span style={{ color: 'rgba(255,255,255,0.48)', fontWeight: 'normal' }}>N{category[0]}</span>
                    {title}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '9px' }}>LIVE</span>
                    <button
                        onClick={onExpand}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255,255,255,0.72)',
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
                padding: '10px',
                background: 'rgba(5, 6, 8, 0.36)'
            }}>
                {isLoading ? (
                    <div style={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        color: 'var(--text-secondary)',
                        textAlign: 'center'
                    }}>
                        Loading live news...
                    </div>
                ) : items.length === 0 ? (
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
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        maxHeight: `${listMaxHeight}px`,
                        overflowY: 'auto',
                        paddingRight: '4px'
                    }}>
                        {items.map((item) => (
                            <div key={item.id} style={{
                                borderLeft: '1px solid rgba(255,255,255,0.12)',
                                background: 'rgba(255,255,255,0.04)',
                                borderRadius: '6px',
                                padding: '8px 10px',
                                position: 'relative',
                                minHeight: `${CARD_ROW_MIN_HEIGHT}px`
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
