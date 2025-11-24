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
 */
export async function openPartPage(partNumber: string): Promise<void> {
  // Assuming the website has a search or part page
  // Adjust the path based on actual website structure
  await openHSSWebsite(`/search?q=${encodeURIComponent(partNumber)}`);
}

/**
 * Open the trade account signup page
 */
export async function openTradeAccountSignup(): Promise<void> {
  await openHSSWebsite('/trade-account');
}

