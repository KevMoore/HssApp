/**
 * Parts search service
 * Handles parts search functionality using WooCommerce REST API
 */

import { Part, SearchParams } from '../types';
import { listProducts, getProduct, listCategories } from './woocommerceService';
import { mapWooCommerceProductToPart, mapWooCommerceProductsToParts } from '../utils/productMapper';

/**
 * Calculate relevance score for a part based on search query
 * Higher score = more relevant
 */
function calculateRelevanceScore(part: Part, queryLower: string): number {
	let score = 0;
	const queryLength = queryLower.length;

	// Field weights (higher = more important)
	const WEIGHTS = {
		partNumber: 10,
		gcNumber: 8,
		name: 6,
		description: 3,
		manufacturer: 2,
	};

	// Match type multipliers
	const EXACT_MATCH = 3;
	const STARTS_WITH = 2;
	const CONTAINS = 1;

	// Check partNumber (most important)
	const partNumberLower = part.partNumber.toLowerCase();
	if (partNumberLower === queryLower) {
		score += WEIGHTS.partNumber * EXACT_MATCH;
	} else if (partNumberLower.startsWith(queryLower)) {
		score += WEIGHTS.partNumber * STARTS_WITH;
	} else if (partNumberLower.includes(queryLower)) {
		score += WEIGHTS.partNumber * CONTAINS;
		// Bonus for earlier position in string
		const position = partNumberLower.indexOf(queryLower);
		score += WEIGHTS.partNumber * (1 - position / partNumberLower.length) * 0.5;
	}

	// Check gcNumber
	if (part.gcNumber) {
		const gcNumberLower = part.gcNumber.toLowerCase();
		if (gcNumberLower === queryLower) {
			score += WEIGHTS.gcNumber * EXACT_MATCH;
		} else if (gcNumberLower.startsWith(queryLower)) {
			score += WEIGHTS.gcNumber * STARTS_WITH;
		} else if (gcNumberLower.includes(queryLower)) {
			score += WEIGHTS.gcNumber * CONTAINS;
			const position = gcNumberLower.indexOf(queryLower);
			score += WEIGHTS.gcNumber * (1 - position / gcNumberLower.length) * 0.5;
		}
	}

	// Check name
	const nameLower = part.name.toLowerCase();
	if (nameLower === queryLower) {
		score += WEIGHTS.name * EXACT_MATCH;
	} else if (nameLower.startsWith(queryLower)) {
		score += WEIGHTS.name * STARTS_WITH;
	} else if (nameLower.includes(queryLower)) {
		score += WEIGHTS.name * CONTAINS;
		const position = nameLower.indexOf(queryLower);
		score += WEIGHTS.name * (1 - position / nameLower.length) * 0.5;
	}

	// Check description
	if (part.description) {
		const descLower = part.description.toLowerCase();
		if (descLower.includes(queryLower)) {
			const position = descLower.indexOf(queryLower);
			score += WEIGHTS.description * CONTAINS;
			score += WEIGHTS.description * (1 - position / descLower.length) * 0.5;
		}
	}

	// Check manufacturer
	const manufacturerLower = part.manufacturer.toLowerCase();
	if (manufacturerLower.includes(queryLower)) {
		const position = manufacturerLower.indexOf(queryLower);
		score += WEIGHTS.manufacturer * CONTAINS;
		score +=
			WEIGHTS.manufacturer * (1 - position / manufacturerLower.length) * 0.5;
	}

	return score;
}

/**
 * Search for parts based on query and filters with relevance ranking
 */
export async function searchParts(params: SearchParams): Promise<Part[]> {
	const { query, filters } = params;
	const queryLower = query.toLowerCase().trim();

	if (!queryLower) {
		return [];
	}

	try {
		// Build WooCommerce API parameters
		const apiParams: {
			search?: string;
			sku?: string;
			status?: string;
			stock_status?: string;
			per_page?: number;
		} = {
			status: 'publish', // Only get published products
			per_page: 100, // Get up to 100 products per page
		};

		// Check if query looks like a SKU (alphanumeric, possibly with dashes)
		const skuPattern = /^[A-Z0-9\-]+$/i;
		if (skuPattern.test(queryLower)) {
			apiParams.sku = query;
		} else {
			apiParams.search = query;
		}

		// Apply stock filter if requested
		if (filters?.inStockOnly) {
			apiParams.stock_status = 'instock';
		}

		// Fetch products from WooCommerce
		const wooProducts = await listProducts(apiParams);
		let parts = mapWooCommerceProductsToParts(wooProducts);

		// Apply client-side filters (manufacturer, category)
		if (filters?.manufacturer) {
			parts = parts.filter((part) => part.manufacturer === filters.manufacturer);
		}

		if (filters?.category) {
			parts = parts.filter((part) => part.category === filters.category);
		}

		// Calculate relevance scores and sort
		const scoredParts = parts
			.map((part) => ({
				part,
				score: calculateRelevanceScore(part, queryLower),
			}))
			.filter(({ score }) => score > 0) // Only include parts with a score > 0
			.sort((a, b) => b.score - a.score) // Sort by relevance score (highest first)
			.map(({ part }) => part);

		return scoredParts;
	} catch (error) {
		console.error('Error searching parts:', error);
		throw new Error('Failed to search parts. Please try again.');
	}
}

// Cache for manufacturers to avoid repeated API calls
let cachedManufacturers: string[] | null = null;
let manufacturersCacheTimestamp: number = 0;
const MANUFACTURERS_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Get popular manufacturers from WooCommerce products
 * Extracts unique manufacturers from product tags and categories
 */
export async function getPopularManufacturers(): Promise<string[]> {
	// Check cache
	const now = Date.now();
	if (cachedManufacturers && now - manufacturersCacheTimestamp < MANUFACTURERS_CACHE_DURATION) {
		return cachedManufacturers;
	}

	try {
		// Fetch a sample of products to extract manufacturers
		// We'll fetch products with tags that might indicate manufacturers
		const products = await listProducts({
			status: 'publish',
			per_page: 100, // Get up to 100 products to extract manufacturers
		});

		const manufacturersSet = new Set<string>();

		// Extract manufacturers from product tags and categories
		for (const product of products) {
			// Check tags for manufacturer indicators
			if (product.tags && product.tags.length > 0) {
				for (const tag of product.tags) {
					const tagName = tag.name.trim();
					// Filter out generic tags and keep manufacturer-like tags
					if (
						tagName.length > 2 &&
						!tagName.toLowerCase().includes('compatible') &&
						!tagName.toLowerCase().includes('fits') &&
						!tagName.toLowerCase().includes('part')
					) {
						manufacturersSet.add(tagName);
					}
				}
			}

			// Also check categories as potential manufacturers
			if (product.categories && product.categories.length > 0) {
				for (const category of product.categories) {
					const categoryName = category.name.trim();
					if (categoryName.length > 2) {
						manufacturersSet.add(categoryName);
					}
				}
			}
		}

		// Convert to array and sort
		cachedManufacturers = Array.from(manufacturersSet)
			.sort()
			.slice(0, 20); // Limit to top 20 manufacturers
		manufacturersCacheTimestamp = now;

		// If we didn't get enough manufacturers, fall back to common ones
		if (cachedManufacturers.length < 5) {
			cachedManufacturers = [
				'Worcester Bosch',
				'Vaillant',
				'GlowWorm',
				'Ideal',
				'Baxi',
				'Intergas',
				'Biasi',
				'Ariston',
				'Vokera',
				'Potterton',
				'Viessmann',
			];
		}

		return cachedManufacturers;
	} catch (error) {
		console.error('Error fetching manufacturers from WooCommerce:', error);
		// Return fallback list on error
		return [
			'Worcester Bosch',
			'Vaillant',
			'GlowWorm',
			'Ideal',
			'Baxi',
			'Intergas',
			'Biasi',
			'Ariston',
			'Vokera',
			'Potterton',
			'Viessmann',
		];
	}
}

// Cache for categories to avoid repeated API calls
let cachedCategories: string[] | null = null;
let categoriesCacheTimestamp: number = 0;
const CATEGORIES_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Get part categories from WooCommerce
 * Fetches categories from WooCommerce categories API
 */
export async function getCategories(): Promise<string[]> {
	// Check cache
	const now = Date.now();
	if (cachedCategories && now - categoriesCacheTimestamp < CATEGORIES_CACHE_DURATION) {
		return cachedCategories;
	}

	try {
		// Fetch categories from WooCommerce
		const categories = await listCategories({
			per_page: 100, // Get up to 100 categories
		});

		// Extract category names
		cachedCategories = categories
			.map((category) => category.name.trim())
			.filter((name) => name.length > 0)
			.sort()
			.slice(0, 50); // Limit to top 50 categories
		categoriesCacheTimestamp = now;

		// If we didn't get enough categories, fall back to common ones
		if (cachedCategories.length < 5) {
			cachedCategories = [
				'Pumps',
				'Heat Exchangers',
				'Electronics',
				'Valves',
				'Fans',
				'Sensors',
				'Burners',
				'Controls',
				'Seals',
				'Filters',
			];
		}

		return cachedCategories;
	} catch (error) {
		console.error('Error fetching categories from WooCommerce:', error);
		// Return fallback list on error
		return [
			'Pumps',
			'Heat Exchangers',
			'Electronics',
			'Valves',
			'Fans',
			'Sensors',
			'Burners',
			'Controls',
			'Seals',
			'Filters',
		];
	}
}

/**
 * Get a single part by ID
 */
export async function getPartById(id: string): Promise<Part | null> {
	try {
		const productId = parseInt(id, 10);
		if (isNaN(productId)) {
			return null;
		}

		const wooProduct = await getProduct(productId);
		return mapWooCommerceProductToPart(wooProduct);
	} catch (error) {
		console.error('Error fetching part by ID:', error);
		return null;
	}
}

/**
 * Get search suggestions from WooCommerce products
 * Returns unique suggestions based on part names, part numbers, and manufacturers
 */
export async function getPartSuggestions(
	query: string,
	maxResults: number = 5
): Promise<string[]> {
	if (!query || !query.trim()) {
		return [];
	}

	try {
		const queryLower = query.trim().toLowerCase();
		const suggestions = new Set<string>();

		// Fetch products from WooCommerce for suggestions
		const apiParams: {
			search?: string;
			sku?: string;
			status?: string;
			per_page?: number;
		} = {
			status: 'publish',
			per_page: 50, // Limit to 50 for suggestions
		};

		// Check if query looks like a SKU
		const skuPattern = /^[A-Z0-9\-]+$/i;
		if (skuPattern.test(queryLower)) {
			apiParams.sku = query;
		} else {
			apiParams.search = query;
		}

		const wooProducts = await listProducts(apiParams);
		const parts = mapWooCommerceProductsToParts(wooProducts);

		// Collect suggestions from parts
		for (const part of parts) {
			// Check part number (starts with)
			if (part.partNumber.toLowerCase().startsWith(queryLower)) {
				suggestions.add(part.partNumber);
			}

			// Check part name (starts with or contains)
			const nameLower = part.name.toLowerCase();
			if (nameLower.startsWith(queryLower) || nameLower.includes(queryLower)) {
				suggestions.add(part.name);
			}

			// Check manufacturer (starts with or contains)
			const manufacturerLower = part.manufacturer.toLowerCase();
			if (
				manufacturerLower.startsWith(queryLower) ||
				manufacturerLower.includes(queryLower)
			) {
				suggestions.add(part.manufacturer);
			}

			// Check GC number if exists
			if (part.gcNumber) {
				const gcLower = part.gcNumber.toLowerCase();
				if (gcLower.startsWith(queryLower) || gcLower.includes(queryLower)) {
					suggestions.add(part.gcNumber);
				}
			}

			// Limit results
			if (suggestions.size >= maxResults * 2) {
				// Get more than needed, then prioritize
				break;
			}
		}

		// Prioritize: exact matches first, then starts with, then contains
		const suggestionsArray = Array.from(suggestions);
		const prioritized: string[] = [];
		const rest: string[] = [];

		for (const suggestion of suggestionsArray) {
			const suggestionLower = suggestion.toLowerCase();
			if (suggestionLower === queryLower) {
				prioritized.unshift(suggestion); // Exact match - highest priority
			} else if (suggestionLower.startsWith(queryLower)) {
				prioritized.push(suggestion); // Starts with - high priority
			} else {
				rest.push(suggestion); // Contains - lower priority
			}
		}

		// Combine prioritized and rest, limit to maxResults
		return [...prioritized, ...rest].slice(0, maxResults);
	} catch (error) {
		console.error('Error getting part suggestions:', error);
		return []; // Return empty array on error
	}
}
