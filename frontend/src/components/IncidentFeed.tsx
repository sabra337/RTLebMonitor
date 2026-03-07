'use client';

import React from 'react';
import { format } from 'date-fns';
import { Incident } from '@/types';

interface IncidentFeedProps {
    incidents: Incident[];
    isLoading: boolean;
}

const IncidentFeed: React.FC<IncidentFeedProps> = ({ incidents, isLoading }) => {
    return (
        <div className="feed-content">
            {isLoading ? (
                <div className="feed-empty-state">Loading live incidents...</div>
            ) : incidents.length === 0 ? (
                <div className="feed-empty-state">No active incidents right now.</div>
            ) : (
                incidents.map((incident, index) => {
                    const feedToneClass = incident.type === 'STRIKE' ? 'feed-item--strike' : 'feed-item--warning';
                    const incidentLabel = incident.type === 'STRIKE' ? 'STRIKE' : 'WARNING';

                    return (
                        <div
                            key={incident.id}
                            className={`feed-item ${feedToneClass}`}
                            style={{ background: index % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent' }}
                        >
                            <div className="feed-item-meta">
                                <span className={`feed-item-badge ${feedToneClass}`}>{incidentLabel}</span>
                                <span className="feed-item-time">{format(new Date(incident.time), 'HH:mm')}</span>
                            </div>

                            <p className="feed-item-text">
                                {incident.text || `${incidentLabel === 'STRIKE' ? 'Strike' : 'Warning'} on ${incident.location}`}
                            </p>

                            <div className="feed-item-subline">
                                <span>{incident.location}</span>
                                <span>#{incident.id.slice(0, 8).toUpperCase()}</span>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default IncidentFeed;
