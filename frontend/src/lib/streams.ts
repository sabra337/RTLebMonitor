export interface StreamSource {
    id: string;
    name: string;
    url: string;
}

export const NEWS_STREAMS: StreamSource[] = [
    { id: 'aljazeera-arabic', name: 'AlJAzeera (arabic)', url: 'https://www.youtube.com/live/bNyUyrR0PHo?si=hiNy0oGF-YTDYpPe' },
    { id: 'the-mirror', name: 'The Mirror', url: 'https://www.youtube.com/live/Q38QnayIRHc?si=u0H4hC_wJRDsID11' },
    { id: 'associated-press', name: 'Associated Press', url: 'https://www.youtube.com/live/-MjIaRlmgRk?si=plvbhp2Qygn_n-tR' },
    { id: 'alarabiya', name: 'AlArabiya', url: 'https://www.youtube.com/live/n7eQejkXbnM?si=Ev-tNys3BEllmxkz' },
    { id: 'aljazeera', name: 'Al Jazeera', url: 'https://www.youtube.com/embed/gCNeDWCI0vo' },
    { id: 'lbci', name: 'LBCI', url: 'https://www.youtube.com/embed/WJ69rP_0V9c' },
    { id: 'aljadeed', name: 'Al Jadeed', url: 'https://www.youtube.com/embed/n3E8j2hMT94' },
    { id: 'mtv', name: 'MTV Lebanon', url: 'https://www.youtube.com/embed/c-p2r6z6rYQ' },
];

export const WEBCAM_STREAMS: StreamSource[] = [
    { id: 'beirut-skyline', name: 'Beirut Skyline', url: 'https://youtu.be/-zGuR1qVKrU' },
    { id: 'tehran-live', name: 'Tehran Live', url: 'https://youtu.be/-zGuR1qVKrU' },
    { id: 'tel-aviv-live', name: 'Tel Aviv View', url: 'https://www.youtube.com/embed/gmtlJ_m2r5A' },
    { id: 'galilee-live', name: 'Galilee View', url: 'https://www.youtube.com/embed/4E-iFtUM2kk' },
];
