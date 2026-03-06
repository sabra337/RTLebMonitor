/**
 * News Retention Utility
 * Keeps only the latest N items per category to prevent database bloat.
 */
async function cleanupNewsItems(supabase, limitPerCategory = 200) {
    const categories = ['LEBANON', 'REGIONAL', 'WORLDWIDE'];

    console.log(`Starting news retention cleanup (Limit: ${limitPerCategory} per category)...`);

    for (const category of categories) {
        try {
            // 1. Find the threshold date (the timestamp of the Nth newest item)
            const { data, error } = await supabase
                .from('news_items')
                .select('published_at')
                .eq('category', category)
                .order('published_at', { ascending: false })
                .range(limitPerCategory - 1, limitPerCategory - 1);

            if (error) {
                console.error(`Error fetching threshold for ${category}:`, error);
                continue;
            }

            if (data && data.length > 0) {
                const thresholdDate = data[0].published_at;

                // 2. Delete everything older than that date for this category
                const { count, error: deleteError } = await supabase
                    .from('news_items')
                    .delete({ count: 'exact' })
                    .eq('category', category)
                    .lt('published_at', thresholdDate);

                if (deleteError) {
                    console.error(`Error deleting old items for ${category}:`, deleteError);
                } else {
                    console.log(`Cleaned up ${count || 0} old items from ${category}.`);
                }
            } else {
                console.log(`Category ${category} has fewer than ${limitPerCategory} items. No cleanup needed.`);
            }
        } catch (e) {
            console.error(`Unexpected error during cleanup for ${category}:`, e);
        }
    }
}

module.exports = { cleanupNewsItems };
