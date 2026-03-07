'use client';

import { useEffect, useState } from 'react';
import { DashboardNewsBuckets, fetchDashboardNews } from '@/lib/api';

const POLL_INTERVAL_MS = 30000;
const EMPTY_NEWS: DashboardNewsBuckets = {
    LEBANON: [],
    REGIONAL: [],
    WORLDWIDE: [],
};

export function useNews() {
    const [newsByCategory, setNewsByCategory] = useState<DashboardNewsBuckets>(EMPTY_NEWS);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadNews = async () => {
            try {
                const data = await fetchDashboardNews();
                if (!isMounted) return;
                setNewsByCategory(data);
                setError(null);
            } catch (err) {
                if (!isMounted) return;
                setError(err instanceof Error ? err.message : 'Failed to load news');
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        void loadNews();
        const intervalId = window.setInterval(() => void loadNews(), POLL_INTERVAL_MS);

        return () => {
            isMounted = false;
            window.clearInterval(intervalId);
        };
    }, []);

    return { newsByCategory, isLoading, error };
}
