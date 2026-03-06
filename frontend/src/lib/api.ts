import { NewsItem, Incident, NewsCategory } from '@/types';

const API_BASE = '/api';

export async function fetchNews(category?: NewsCategory, limit: number = 20): Promise<Record<string, NewsItem[]> | { items: NewsItem[] }> {
    try {
        const url = new URL(`${window.location.origin}${API_BASE}/news`);
        if (category) url.searchParams.append('category', category);
        url.searchParams.append('limit', limit.toString());

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error('Failed to fetch news');
        return await res.json();
    } catch (error) {
        console.error('Error fetching news:', error);
        return {};
    }
}

export async function fetchIncidents(): Promise<Incident[]> {
    try {
        const res = await fetch(`${API_BASE}/incidents`);
        if (!res.ok) throw new Error('Failed to fetch incidents');
        const data = await res.json();
        return data.items || [];
    } catch (error) {
        console.error('Error fetching incidents:', error);
        return [];
    }
}
