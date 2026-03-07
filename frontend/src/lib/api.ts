import { NewsItem, Incident, NewsCategory } from '@/types';

const envApiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
const localApiBase =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3000'
        : '';
const API_ROOT = `${(envApiBase || localApiBase || '').replace(/\/$/, '')}/api`.replace(/^\/api$/, '/api');

const apiUrl = (path: string) => `${API_ROOT}${path}`;

export type DashboardNewsCategory = 'LEBANON' | 'REGIONAL' | 'WORLDWIDE';
export type DashboardNewsBuckets = Record<DashboardNewsCategory, NewsItem[]>;

const EMPTY_NEWS_BUCKETS: DashboardNewsBuckets = {
    LEBANON: [],
    REGIONAL: [],
    WORLDWIDE: [],
};

interface RawNewsItem {
    id?: string;
    headline?: string;
    summary?: string;
    time?: string;
    source?: string;
    category?: string;
    link?: string | null;
    language?: string;
}

interface RawIncidentItem {
    id?: string;
    text?: string;
    type?: string;
    location?: string;
    time?: string;
    severity?: number | string;
    coordinates?: {
        lat?: number;
        lng?: number;
    } | null;
}

export async function fetchNews(category?: NewsCategory, limit: number = 20): Promise<Record<string, NewsItem[]> | { items: NewsItem[] }> {
    try {
        const url = new URL(apiUrl('/news'), window.location.origin);
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
        const res = await fetch(apiUrl('/incidents'));
        if (!res.ok) throw new Error('Failed to fetch incidents');
        const data = await res.json();
        const items: RawIncidentItem[] = Array.isArray(data.items) ? data.items : [];
        return items
            .filter((item) => item?.id && item?.type && item?.location && item?.time)
            .map((item) => ({
                id: String(item.id),
                text: String(item.text || `${item.type === 'STRIKE' ? 'Strike' : 'Warning'} on ${item.location}`),
                type: item.type === 'STRIKE' ? 'STRIKE' : 'WARNING',
                location: String(item.location),
                time: String(item.time),
                severity:
                    typeof item.severity === 'number'
                        ? item.severity
                        : typeof item.severity === 'string' && item.severity.trim() !== '' && !Number.isNaN(Number(item.severity))
                            ? Number(item.severity)
                            : undefined,
                coordinates:
                    item.coordinates &&
                    typeof item.coordinates.lat === 'number' &&
                    typeof item.coordinates.lng === 'number'
                        ? { lat: item.coordinates.lat, lng: item.coordinates.lng }
                        : null,
            }));
    } catch (error) {
        console.error('Error fetching incidents:', error);
        return [];
    }
}

export async function fetchDashboardNews(limit: number = 40): Promise<DashboardNewsBuckets> {
    try {
        const url = new URL(apiUrl('/news'), window.location.origin);
        url.searchParams.append('limit', limit.toString());

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error('Failed to fetch dashboard news');

        const data = await res.json();
        const normalizeItems = (items: unknown, fallbackCategory: DashboardNewsCategory): NewsItem[] => {
            if (!Array.isArray(items)) return [];
            return items
                .filter((item): item is RawNewsItem => !!item && typeof item === 'object')
                .map((item) => ({
                    id: String(item.id ?? crypto.randomUUID()),
                    headline: String(item.headline ?? item.summary ?? ''),
                    summary: String(item.summary ?? ''),
                    time: String(item.time ?? new Date().toISOString()),
                    source: String(item.source ?? 'UNKNOWN'),
                    category:
                        item.category === 'LEBANON' || item.category === 'REGIONAL' || item.category === 'WORLDWIDE'
                            ? item.category
                            : fallbackCategory,
                    link: item.link ? String(item.link) : null,
                    language: item.language ? String(item.language) : undefined,
                }));
        };

        return {
            LEBANON: normalizeItems(data?.LEBANON, 'LEBANON'),
            REGIONAL: normalizeItems(data?.REGIONAL, 'REGIONAL'),
            WORLDWIDE: normalizeItems(data?.WORLDWIDE, 'WORLDWIDE'),
        };
    } catch (error) {
        console.error('Error fetching dashboard news:', error);
        return EMPTY_NEWS_BUCKETS;
    }
}
