'use client';

import { useEffect, useState } from 'react';
import { fetchIncidents } from '@/lib/api';
import { Incident } from '@/types';

const POLL_INTERVAL_MS = 20000;

export function useIncidents() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadIncidents = async () => {
            try {
                const data = await fetchIncidents();
                if (!isMounted) return;
                setIncidents(data);
                setError(null);
            } catch (err) {
                if (!isMounted) return;
                setError(err instanceof Error ? err.message : 'Failed to load incidents');
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        void loadIncidents();
        const intervalId = window.setInterval(() => void loadIncidents(), POLL_INTERVAL_MS);

        return () => {
            isMounted = false;
            window.clearInterval(intervalId);
        };
    }, []);

    return { incidents, isLoading, error };
}
