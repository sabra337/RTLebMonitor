'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MOCK_INCIDENTS } from '@/lib/mockData';

// Fix for default marker icons in Leaflet with Next.js
const fixLeafletIcons = () => {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
};

const MapArea: React.FC = () => {
    useEffect(() => {
        fixLeafletIcons();
    }, []);

    const center: [number, number] = [33.8938, 35.5018]; // Beirut

    return (
        <div style={{ height: '100%', width: '100%', background: '#0a0a0a' }}>
            <MapContainer
                center={center}
                zoom={10}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {MOCK_INCIDENTS.map(inc => (
                    <React.Fragment key={inc.id}>
                        <Circle
                            center={[33.88 + Math.random() * 0.1, 35.50 + Math.random() * 0.1]}
                            radius={inc.type === 'STRIKE' ? 2000 : 4000}
                            pathOptions={{
                                color: inc.type === 'STRIKE' ? 'var(--glow-red)' : 'var(--glow-amber)',
                                fillColor: inc.type === 'STRIKE' ? 'var(--glow-red)' : 'var(--glow-amber)',
                                fillOpacity: 0.15,
                                weight: 1
                            }}
                        />
                        <Marker position={[33.88 + Math.random() * 0.1, 35.50 + Math.random() * 0.1]}>
                            <Popup>
                                <div style={{ background: '#111', color: '#fff', padding: '10px', fontSize: '11px' }}>
                                    <p style={{ fontWeight: 'bold', margin: '0 0 5px 0', borderBottom: '1px solid #333' }}>{inc.type}</p>
                                    <p>{inc.text}</p>
                                    <p style={{ fontSize: '9px', color: '#999', marginTop: '5px' }}>{new Date(inc.time).toLocaleTimeString()}</p>
                                </div>
                            </Popup>
                        </Marker>
                    </React.Fragment>
                ))}
            </MapContainer>

            {/* Manual Legend / Controls */}
            <div style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 1000, pointerEvents: 'none' }}>
                <div className="glass-panel" style={{ padding: '12px', fontSize: '10px', textTransform: 'uppercase', minWidth: '160px' }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '4px' }}>LEGEND / OPS VIEW</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ color: 'var(--glow-amber)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 5px var(--glow-amber)' }}></span> Warning Zone
                        </span>
                        <span style={{ color: 'var(--glow-red)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 5px var(--glow-red)' }}></span> Confirmed Strike
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapArea;
