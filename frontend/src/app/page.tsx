'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import TopBar from "@/components/TopBar";
import NewsCard from "@/components/NewsCard";
import StreamCard from "@/components/StreamCard";
import Modal from "@/components/Modal";
import IncidentFeed from "@/components/IncidentFeed";
import { useIncidents } from "@/hooks/useIncidents";
import { useNews } from "@/hooks/useNews";
import { DashboardNewsCategory } from "@/lib/api";
import { NewsItem } from "@/types";
import { format } from 'date-fns';

// Dynamic import for Map to avoid SSR issues
const MapArea = dynamic(() => import('@/components/Map/MapArea'), {
  ssr: false,
  loading: () => <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>INITIALIZING MAP ENGINE...</div>
});

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<DashboardNewsCategory | null>(null);
  const [modalPage, setModalPage] = useState(1);
  const { incidents, isLoading: incidentsLoading } = useIncidents();
  const { newsByCategory, isLoading: newsLoading } = useNews();
  const CARD_MAX_ITEMS = 10;
  const CARD_VISIBLE_ITEMS = 5;
  const MODAL_PAGE_SIZE = 20;

  const categories: { key: DashboardNewsCategory; title: string }[] = [
    { key: 'LEBANON', title: 'Lebanon News' },
    { key: 'REGIONAL', title: 'Regional News' },
    { key: 'WORLDWIDE', title: 'Worldwide News' },
  ];

  const handleExpand = (cat: DashboardNewsCategory) => {
    setSelectedCategory(cat);
    setModalPage(1);
  };

  const selectedCategoryItems = selectedCategory ? newsByCategory[selectedCategory] || [] : [];
  const totalModalPages = Math.max(1, Math.ceil(selectedCategoryItems.length / MODAL_PAGE_SIZE));
  const clampedModalPage = Math.min(modalPage, totalModalPages);
  const modalPageItems = selectedCategoryItems.slice(
    (clampedModalPage - 1) * MODAL_PAGE_SIZE,
    clampedModalPage * MODAL_PAGE_SIZE
  );

  return (
    <div className="dashboard-container">
      <TopBar />

      <div className="main-content">
        {/* Top Section: Map/Stream and Live Feed */}
        <div className="top-section">
          {/* Left Column: Map and Stream under it */}
          <div className="section-cell left-column">
            <div className="map-container-wrapper">
              <MapArea incidents={incidents} />
            </div>
            <div className="stream-container-wrapper">
              <StreamCard />
            </div>
          </div>

          {/* Right Column: Live Feed */}
          <div className="section-cell right-column">
            <div className="feed-header">
              <h2 style={{ fontSize: '12px', textTransform: 'uppercase', margin: 0, fontWeight: 'bold' }}>
                LIVE FEED <span style={{ color: 'var(--glow-amber)', marginLeft: '8px', opacity: 0.7 }}>[{incidents.length} ACTIVE]</span>
              </h2>
              <span className="status-pulsing" style={{ color: 'var(--glow-red)', fontSize: '9px', fontWeight: 'bold', paddingLeft: '15px' }}>LIVE</span>
            </div>
            <IncidentFeed incidents={incidents} isLoading={incidentsLoading} />
          </div>
        </div>

        {/* Bottom Section: News Grid */}
        <div className="bottom-section">
          {categories.map((cat) => (
            <div key={cat.key} className="section-cell">
              <NewsCard
                category={cat.key}
                title={cat.title}
                items={newsByCategory[cat.key]?.slice(0, CARD_MAX_ITEMS) || []}
                isLoading={newsLoading}
                visibleItems={CARD_VISIBLE_ITEMS}
                onExpand={() => handleExpand(cat.key)}
              />
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={!!selectedCategory}
        onClose={() => {
          setSelectedCategory(null);
          setModalPage(1);
        }}
        title={`${selectedCategory} NEWS - EMERGENCY FEED`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {modalPageItems.length === 0 ? (
            <div className="glass-card" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No records available for this category.
            </div>
          ) : (
            modalPageItems.map((item: NewsItem) => (
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
            ))
          )}

          {selectedCategoryItems.length > MODAL_PAGE_SIZE && (
            <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setModalPage((p) => Math.max(1, p - 1))}
                disabled={clampedModalPage === 1}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-glass)',
                  background: 'rgba(255,255,255,0.06)',
                  color: clampedModalPage === 1 ? 'var(--text-secondary)' : 'var(--text-primary)',
                  cursor: clampedModalPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>

              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Page {clampedModalPage} / {totalModalPages}
              </span>

              <button
                onClick={() => setModalPage((p) => Math.min(totalModalPages, p + 1))}
                disabled={clampedModalPage >= totalModalPages}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-glass)',
                  background: 'rgba(255,255,255,0.06)',
                  color: clampedModalPage >= totalModalPages ? 'var(--text-secondary)' : 'var(--text-primary)',
                  cursor: clampedModalPage >= totalModalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
