/**
 * Utility functions for linking to external websites
 */

import * as Linking from 'expo-linking';

const HSS_WEBSITE_URL = 'https://hssspares.co.uk';

/**
 * Open the HSS website in the browser
 */
export async function openHSSWebsite(path?: string): Promise<void> {
	const url = path ? `${HSS_WEBSITE_URL}${path}` : HSS_WEBSITE_URL;
	const supported = await Linking.canOpenURL(url);

	if (supported) {
		await Linking.openURL(url);
	} else {
		console.error(`Don't know how to open URI: ${url}`);
	}
}

/**
 * Open a part page on the HSS website
 * Format: /product/{manufacturer-lowercase}-{partnumber}/
 */
export async function openPartPage(
	partNumber: string,
	manufacturer?: string
): Promise<void> {
	// Construct the product URL in the format: /product/{manufacturer}-{partnumber}/
	const manufacturerSlug = manufacturer
		? manufacturer.toLowerCase().replace(/\s+/g, '-')
		: 'part';
	const productSlug = `${manufacturerSlug}-${partNumber.toLowerCase()}`;
	await openHSSWebsite(`/product/${productSlug}/`);
}

/**
 * Open the trade account signup page
 */
export async function openTradeAccountSignup(): Promise<void> {
	await openHSSWebsite('/trade-account');
}
