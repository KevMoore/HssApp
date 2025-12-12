/**
 * Product Mapper
 * Maps WooCommerce product data to Part interface
 */

import { Part } from '../types';
import { WooCommerceProduct } from '../services/woocommerceService';
import { stripHtmlTags } from './htmlUtils';

/**
 * Map WooCommerce product to Part interface
 */
export function mapWooCommerceProductToPart(product: WooCommerceProduct): Part {
	// Extract first image URL with better error handling and logging
	let imageUrl: string | undefined = undefined;

	if (
		product.images &&
		Array.isArray(product.images) &&
		product.images.length > 0
	) {
		const firstImage = product.images[0];
		if (firstImage && firstImage.src) {
			const src = firstImage.src.trim();
			// Only set imageUrl if it's a non-empty string
			if (src && src.length > 0) {
				imageUrl = src;
			}
		}
	}

	// Log image extraction for debugging
	if (!imageUrl) {
		console.log('[ProductMapper] No image found for product:', {
			id: product.id,
			name: product.name,
			hasImages: !!product.images,
			imagesLength: product.images?.length || 0,
			imagesArray: product.images,
		});
	} else {
		console.log('[ProductMapper] Image extracted for product:', {
			id: product.id,
			name: product.name,
			imageUrl,
		});
	}

	// Extract category name (use first category)
	const category =
		product.categories && product.categories.length > 0
			? product.categories[0].name
			: undefined;

	// Extract manufacturer from categories or tags
	// Look for manufacturer in tags or use first category as fallback
	let manufacturer = category || 'Unknown';
	if (product.tags && product.tags.length > 0) {
		// Try to find a manufacturer tag
		const manufacturerTag = product.tags.find((tag) =>
			['manufacturer', 'brand', 'make'].some((keyword) =>
				tag.name.toLowerCase().includes(keyword)
			)
		);
		if (manufacturerTag) {
			manufacturer = manufacturerTag.name;
		}
	}

	// Determine stock status
	const inStock =
		product.stock_status === 'instock' ||
		(product.stock_quantity !== null && product.stock_quantity > 0);

	// Parse price (WooCommerce returns prices as strings)
	const price = product.price
		? parseFloat(product.price)
		: product.regular_price
		? parseFloat(product.regular_price)
		: undefined;

	// Extract GC number from SKU or meta data if available
	// This might need to be adjusted based on your actual data structure
	let gcNumber: string | undefined;
	if (product.sku) {
		// Check if SKU contains GC pattern
		const gcMatch = product.sku.match(/GC[- ]?(\d+)/i);
		if (gcMatch) {
			gcNumber = gcMatch[1];
		}
	}

	// Extract compatible appliances from tags or attributes
	const compatibleWith: string[] = [];
	if (product.tags && product.tags.length > 0) {
		product.tags.forEach((tag) => {
			// Filter out manufacturer tags and add model/compatibility tags
			if (
				!tag.name.toLowerCase().includes('manufacturer') &&
				!tag.name.toLowerCase().includes('brand')
			) {
				compatibleWith.push(tag.name);
			}
		});
	}

	// Clean descriptions by stripping HTML tags
	const rawDescription = product.short_description || product.description || '';
	const cleanDescription = stripHtmlTags(rawDescription);

	return {
		id: String(product.id),
		partNumber: product.sku || String(product.id),
		gcNumber,
		name: product.name,
		description: cleanDescription || undefined,
		manufacturer,
		category,
		price,
		inStock,
		imageUrl,
		compatibleWith: compatibleWith.length > 0 ? compatibleWith : undefined,
	};
}

/**
 * Map array of WooCommerce products to Part array
 */
export function mapWooCommerceProductsToParts(
	products: WooCommerceProduct[]
): Part[] {
	return products.map(mapWooCommerceProductToPart);
}
