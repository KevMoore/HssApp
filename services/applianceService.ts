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
	const imageUrl = category.image?.src || getDefaultImageUrl(category.slug);
	
	console.log('[Appliances] Mapping category:', {
		categoryId: category.id,
		categoryName: category.name,
		hasImage: !!category.image,
		imageObject: category.image,
		imageSrc: category.image?.src,
		finalImageUrl: imageUrl,
	});

	return {
		id: String(category.id),
		name: category.name.toUpperCase(),
		value: category.slug,
		imageUrl,
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
		console.log('[Appliances] Fetching categories from WooCommerce...');
		
		// Fetch all categories from WooCommerce
		const categories = await listCategories({
			per_page: 100, // Get up to 100 categories
		});

		console.log('[Appliances] Received categories:', {
			count: categories.length,
			firstCategory: categories[0] ? {
				id: categories[0].id,
				name: categories[0].name,
				slug: categories[0].slug,
				hasImage: !!categories[0].image,
				image: categories[0].image,
			} : null,
			allCategories: categories.map(cat => ({
				id: cat.id,
				name: cat.name,
				hasImage: !!cat.image,
				imageSrc: cat.image?.src,
			})),
		});

		// Map categories to appliances
		cachedAppliances = categories.map(mapCategoryToAppliance);
		
		console.log('[Appliances] Mapped to appliances:', {
			count: cachedAppliances.length,
			firstAppliance: cachedAppliances[0] ? {
				id: cachedAppliances[0].id,
				name: cachedAppliances[0].name,
				imageUrl: cachedAppliances[0].imageUrl,
			} : null,
			allAppliances: cachedAppliances.map(app => ({
				id: app.id,
				name: app.name,
				imageUrl: app.imageUrl,
			})),
		});

		cacheTimestamp = now;

		return cachedAppliances;
	} catch (error) {
		console.error('[Appliances] Error fetching appliances from WooCommerce:', {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});
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
