/**
 * HTML Utilities
 * Functions to clean and process HTML content
 */

/**
 * Strip HTML tags from a string
 * Removes all HTML tags and decodes HTML entities
 * @param htmlString String containing HTML
 * @returns Plain text string
 */
export function stripHtmlTags(htmlString: string | null | undefined): string {
	if (!htmlString) {
		return '';
	}

	// Remove HTML tags using regex
	let text = htmlString.replace(/<[^>]*>/g, '');

	// Decode common HTML entities
	text = text
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&apos;/g, "'")
		.replace(/&copy;/g, '©')
		.replace(/&reg;/g, '®')
		.replace(/&trade;/g, '™')
		.replace(/&hellip;/g, '...')
		.replace(/&mdash;/g, '\u2014')
		.replace(/&ndash;/g, '\u2013')
		.replace(/&lsquo;/g, '\u2018')
		.replace(/&rsquo;/g, '\u2019')
		.replace(/&ldquo;/g, '\u201C')
		.replace(/&rdquo;/g, '\u201D')
		.replace(/&bull;/g, '\u2022')
		.replace(/&middot;/g, '\u00B7');

	// Decode numeric HTML entities (e.g., &#8217;)
	text = text.replace(/&#(\d+);/g, (match, dec) => {
		return String.fromCharCode(parseInt(dec, 10));
	});

	// Decode hex HTML entities (e.g., &#x27;)
	text = text.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
		return String.fromCharCode(parseInt(hex, 16));
	});

	// Clean up multiple spaces and trim
	text = text.replace(/\s+/g, ' ').trim();

	return text;
}

/**
 * Truncate text to a maximum length with ellipsis
 * @param text Text to truncate
 * @param maxLength Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
	if (!text || text.length <= maxLength) {
		return text;
	}
	return text.substring(0, maxLength).trim() + '...';
}

