'use client';

import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Incident } from '@/types';

// Fix for default marker icons in Leaflet with Next.js
const fixLeafletIcons = () => {
    // @ts-expect-error Leaflet augments this private prototype member at runtime.
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
};

const warningIcon = L.divIcon({
    className: 'warning-pin-wrapper',
    html: '<div class="warning-pin-dot"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
});

interface MapAreaProps {
    incidents: Incident[];
}

const MapArea: React.FC<MapAreaProps> = ({ incidents }) => {
    useEffect(() => {
        fixLeafletIcons();
    }, []);

    const center: [number, number] = [33.8938, 35.5018];
    const plottedIncidents = useMemo(
        () =>
            incidents.filter(
                (incident) =>
                    incident.coordinates &&
                    Number.isFinite(incident.coordinates.lat) &&
                    Number.isFinite(incident.coordinates.lng)
            ),
        [incidents]
    );

    const strikeCount = plottedIncidents.filter((incident) => incident.type === 'STRIKE').length;
    const warningCount = plottedIncidents.filter((incident) => incident.type === 'WARNING').length;

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

                {plottedIncidents.map((incident) => {
                    const centerPoint: [number, number] = [incident.coordinates!.lat, incident.coordinates!.lng];
                    const isStrike = incident.type === 'STRIKE';
                    const radius = isStrike ? 1100 : 700;
                    const tone = isStrike ? 'var(--glow-red)' : 'var(--glow-amber)';

                    return (
                        <React.Fragment key={incident.id}>
                            <Circle
                                center={centerPoint}
                                radius={radius}
                                pathOptions={{
                                    color: tone,
                                    fillColor: tone,
                                    fillOpacity: isStrike ? 0.14 : 0.1,
                                    weight: 1
                                }}
                            />

                            {isStrike ? (
                                <CircleMarker
                                    center={centerPoint}
                                    radius={9}
                                    pathOptions={{
                                        color: 'var(--glow-red)',
                                        fillColor: 'var(--glow-red)',
                                        fillOpacity: 0.85,
                                        weight: 2
                                    }}
                                >
                                    <Popup>
                                        <div className="map-popup">
                                            <p className="map-popup-title">STRIKE</p>
                                            <p>{incident.text}</p>
                                            <p className="map-popup-time">{new Date(incident.time).toLocaleString()}</p>
                                        </div>
                                    </Popup>
                                </CircleMarker>
                            ) : (
                                <Marker position={centerPoint} icon={warningIcon}>
                                    <Popup>
                                        <div className="map-popup">
                                            <p className="map-popup-title">WARNING</p>
                                            <p>{incident.text}</p>
                                            <p className="map-popup-time">{new Date(incident.time).toLocaleString()}</p>
                                        </div>
                                    </Popup>
                                </Marker>
                            )}
                        </React.Fragment>
                    );
                })}
            </MapContainer>

            <div style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 1000, pointerEvents: 'none' }}>
                <div className="glass-panel" style={{ padding: '12px', fontSize: '10px', textTransform: 'uppercase', minWidth: '170px' }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '4px' }}>LEGEND / OPS VIEW</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ color: 'var(--glow-amber)', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'space-between' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 5px var(--glow-amber)' }}></span>
                                Warning
                            </span>
                            <span style={{ color: 'var(--text-primary)' }}>{warningCount}</span>
                        </span>
                        <span style={{ color: 'var(--glow-red)', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'space-between' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 5px var(--glow-red)' }}></span>
                                Strike
                            </span>
                            <span style={{ color: 'var(--text-primary)' }}>{strikeCount}</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapArea;
