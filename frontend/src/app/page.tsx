'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import TopBar from "@/components/TopBar";
import NewsCard from "@/components/NewsCard";
import StreamCard from "@/components/StreamCard";
import Modal from "@/components/Modal";
import { MOCK_NEWS } from "@/lib/mockData";
import { NewsCategory, NewsItem } from "@/types";
import { format } from 'date-fns';

// Dynamic import for Map to avoid SSR issues
const MapArea = dynamic(() => import('@/components/Map/MapArea'), {
  ssr: false,
  loading: () => <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>INITIALIZING MAP ENGINE...</div>
});

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | null>(null);

  const categories: { key: NewsCategory; title: string }[] = [
    { key: 'LEBANON', title: 'Lebanon News' },
    { key: 'REGIONAL', title: 'Regional News' },
    { key: 'WORLDWIDE', title: 'Worldwide News' },
  ];

  const handleExpand = (cat: NewsCategory) => {
    setSelectedCategory(cat);
  };

  return (
    <div className="dashboard-container">
      <TopBar />

      <div className="main-content">
        {/* Top Section: Map/Stream and Live Feed */}
        <div className="top-section">
          {/* Left Column: Map and Stream under it */}
          <div className="section-cell left-column">
            <div className="map-container-wrapper">
              <MapArea />
            </div>
            <div className="stream-container-wrapper">
              <StreamCard />
            </div>
          </div>

          {/* Right Column: Live Feed */}
          <div className="section-cell right-column">
            <div className="feed-header">
              <h2 style={{ fontSize: '12px', textTransform: 'uppercase', margin: 0, fontWeight: 'bold' }}>
                LIVE FEED <span style={{ color: 'var(--glow-amber)', marginLeft: '8px', opacity: 0.7 }}>[8 ACTIVE]</span>
              </h2>
              <span className="status-pulsing" style={{ color: 'var(--glow-red)', fontSize: '9px', fontWeight: 'bold', paddingLeft: '15px' }}>LIVE</span>
            </div>
            <div className="feed-content">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="feed-item" style={{
                  background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '9px', color: 'var(--glow-amber)', fontWeight: 'bold' }}>{format(new Date(), 'HH:mm')}</span>
                    <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>INCIDENT #RD-00{i}</span>
                  </div>
                  <p style={{ fontSize: '12px', margin: 0, lineHeight: '1.5', color: 'rgba(255,255,255,0.9)' }}>
                    Intelligence report indicates potential activity in southern sector. Surveillance assets detecting anomalies in grid 442/B.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section: News Grid */}
        <div className="bottom-section">
          {categories.map((cat) => (
            <div key={cat.key} className="section-cell">
              <NewsCard
                category={cat.key}
                title={cat.title}
                items={MOCK_NEWS[cat.key]?.slice(0, 5) || []}
                onExpand={() => handleExpand(cat.key)}
              />
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={!!selectedCategory}
        onClose={() => setSelectedCategory(null)}
        title={`${selectedCategory} NEWS - EMERGENCY FEED`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {(MOCK_NEWS[selectedCategory!] || []).map((item: NewsItem) => (
            <div key={item.id} className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: 'var(--glow-cyan)', fontSize: '12px', fontWeight: 'bold' }}>
                  {format(new Date(item.time), 'yyyy-MM-dd HH:mm:ss')}
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase' }}>
                  SOURCE: {item.source}
                </span>
              </div>
              <h3 style={{ fontSize: '18px', margin: '0 0 10px 0', lineHeight: '1.3' }}>{item.headline}</h3>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', margin: 0 }}>{item.summary}</p>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
