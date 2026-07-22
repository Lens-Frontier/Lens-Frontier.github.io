import rss from '@astrojs/rss';
import { entryPath, languageFrom, languages, siteFor } from '../../lib/site';
import { publishedEntries } from '../../lib/content';

export function getStaticPaths() {
	return languages.map((lang) => ({ params: { lang }, props: { lang } }));
}

export async function GET(context: any) {
	const lang = languageFrom(context.props.lang);
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
