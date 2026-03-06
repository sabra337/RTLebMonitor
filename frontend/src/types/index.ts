export type NewsCategory = 'LEBANON' | 'IRAN' | 'USA' | 'REGIONAL' | 'WORLDWIDE';

export interface NewsItem {
    id: string;
    headline: string;
    summary: string;
    time: string;
    source: string;
    category: NewsCategory;
    link?: string | null;
    language?: string;
    imageUrl?: string;
}

export interface Incident {
    id: string;
    text: string;
    type: 'STRIKE' | 'WARNING' | 'SHELTER';
    location: string;
    time: string;
    severity?: string;
}
