import { NewsItem, Incident } from '@/types';

export const MOCK_NEWS: Record<string, NewsItem[]> = {
    LEBANON: [
        {
            id: 'l1',
            headline: 'Lebanese Ministry of Health reports update on casualty numbers following tonight\'s strikes.',
            summary: 'The ministry stated that rescue operations are ongoing in several sectors of Beirut.',
            time: new Date().toISOString(),
            source: 'MOH LEBANON',
            category: 'LEBANON'
        },
        {
            id: 'l2',
            headline: 'Electricité du Liban announces temporary power grid stabilization measures.',
            summary: 'EDL officials met to discuss emergency fuel supplies for the Zahrani plant.',
            time: new Date(Date.now() - 3600000).toISOString(),
            source: 'NNA',
            category: 'LEBANON'
        }
    ],
    IRAN: [
        {
            id: 'i1',
            headline: 'Iran targets headquarters of Iranian Kurdish forces in Iraq',
            summary: 'Official statements from Tehran confirm operations across the border.',
            time: new Date(Date.now() - 2 * 3600000).toISOString(),
            source: 'BBC NEWS',
            category: 'IRAN'
        }
    ],
    USA: [],
    REGIONAL: [
        {
            id: 'r1',
            headline: 'Delayed United Kingdom rescue flight due to leave Middle East on Thursday, says minister',
            summary: 'Logistical hurdles cited for the 24-hour delay in the evacuation timeline.',
            time: new Date(Date.now() - 4 * 3600000).toISOString(),
            source: 'THE GUARDIAN',
            category: 'REGIONAL'
        }
    ],
    WORLDWIDE: [
        {
            id: 'w1',
            headline: 'The case for and against each NHL wild-card playoff hopeful',
            summary: 'Analysis of the current standings as the regular season enters its final week.',
            time: new Date(Date.now() - 5 * 3600000).toISOString(),
            source: 'THE NEW YORK TIMES',
            category: 'WORLDWIDE'
        }
    ]
};

export const MOCK_INCIDENTS: Incident[] = [
    {
        id: 'inc1',
        text: 'Strike on Dahieh, South Beirut',
        type: 'STRIKE',
        location: 'Dahieh',
        time: new Date().toISOString(),
        severity: 'HIGH'
    },
    {
        id: 'inc2',
        text: 'Warning on Bourj Hammoud',
        type: 'WARNING',
        location: 'Bourj Hammoud',
        time: new Date().toISOString(),
        severity: 'MEDIUM'
    }
];
