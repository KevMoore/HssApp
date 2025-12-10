/**
 * Appliance service
 * Provides appliance data for the appliance selection modal
 * Uses WooCommerce product categories as appliances
 */

import { listCategories, WooCommerceCategory } from './woocommerceService';

export interface Appliance {
	id: string;
	name: string;
	value: string; // URL-friendly value (e.g., "ariston", "worcester")
	imageUrl: string; // Category image or placeholder
}

// Cache for categories to avoid repeated API calls
let cachedAppliances: Appliance[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Map WooCommerce category to Appliance interface
 */
function mapCategoryToAppliance(category: WooCommerceCategory): Appliance {
	return {
		id: String(category.id),
		name: category.name.toUpperCase(),
		value: category.slug,
		imageUrl: category.image?.src || getDefaultImageUrl(category.slug),
	};
}

/**
 * Get default image URL for a category slug
 */
function getDefaultImageUrl(slug: string): string {
	// Use a placeholder image - can be enhanced with category-specific images
	return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&q=80';
}

/**
 * Get all available appliances from WooCommerce categories
 */
export async function getAllAppliances(): Promise<Appliance[]> {
	// Check cache
	const now = Date.now();
	if (cachedAppliances && now - cacheTimestamp < CACHE_DURATION) {
		return cachedAppliances;
	}

	try {
		// Fetch all categories from WooCommerce
		const categories = await listCategories({
			per_page: 100, // Get up to 100 categories
		});

		// Map categories to appliances
		cachedAppliances = categories.map(mapCategoryToAppliance);
		cacheTimestamp = now;

		return cachedAppliances;
	} catch (error) {
		console.error('Error fetching appliances from WooCommerce:', error);
		// Return empty array or fallback data on error
		return [];
	}
}

/**
 * Get appliance by value (slug)
 */
export async function getApplianceByValue(value: string): Promise<Appliance | undefined> {
	const appliances = await getAllAppliances();
	return appliances.find((appliance) => appliance.value === value);
}
