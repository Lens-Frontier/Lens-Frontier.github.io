import rss from '@astrojs/rss';
import { entryPath, siteFor } from '../lib/site';
import { publishedEntries } from '../lib/content';

export async function GET(context: any) {
	const lang = 'zh';
	const site = siteFor(lang);
	const feedSite = new URL(import.meta.env.BASE_URL, context.site).toString();
	const items = (await publishedEntries(lang)).map(({ collection, entry }) => ({
		title: entry.data.title,
		description: entry.data.summary,
		pubDate: entry.data.date,
		link: entryPath(collection, entry.id, lang),
	}));

	return rss({
		title: site.title,
		description: site.description,
		site: feedSite,
		items,
	});
}
