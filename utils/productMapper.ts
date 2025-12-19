/**
 * Product Mapper
 * Maps WooCommerce product data to Part interface
 */

import { Part } from '../types';
import { WooCommerceProduct } from '../services/woocommerceService';
import { stripHtmlTags } from './htmlUtils';

/**
 * Helper function to parse PHP serialized array format or JSON array
 * Handles format like: {i:0;s:9:"4153216 ";i:1;s:9:"4153219 ";}
 * or JSON array: ["4153216", "4153219"]
 */
function parseGcCodes(value: unknown): string[] {
	if (!value) return [];
	
	// Handle array directly
	if (Array.isArray(value)) {
		return value.map(String).filter(v => v.trim());
	}
	
	// Handle string
	if (typeof value !== 'string') {
		return [];
	}
	
	const str = value.trim();
	if (!str) return [];
	
	// Try to parse as JSON first
	try {
		const parsed = JSON.parse(str);
		if (Array.isArray(parsed)) {
			return parsed.map(String).filter(v => v.trim());
		}
	} catch {
		// Not JSON, continue to PHP serialized format
	}
	
	// Parse PHP serialized array format: {i:0;s:9:"value1";i:1;s:9:"value2";}
	const values: string[] = [];
	const regex = /i:\d+;s:\d+:"([^"]+)";/g;
	let match;
	while ((match = regex.exec(str)) !== null) {
		values.push(match[1].trim());
	}
	
	// If no matches found and it's a simple string, return as single value
	if (values.length === 0 && str) {
		return [str];
	}
	
	return values.filter(v => v);
}

/**
 * Helper function to get meta field value from meta_data array
 */
function getMetaFieldValue(
	metaData: Array<{ id?: number; key: string; value: string | number | boolean | object | null }>,
	key: string
): unknown {
	const metaItem = metaData.find(m => m.key === key);
	return metaItem?.value ?? null;
}

/**
 * Map WooCommerce product to Part interface
 */
export function mapWooCommerceProductToPart(product: WooCommerceProduct): Part {
	// Extract all image URLs
	const imageUrls: string[] = [];
	if (product.images && Array.isArray(product.images) && product.images.length > 0) {
		product.images.forEach((img) => {
			if (img && img.src) {
				const src = img.src.trim();
				if (src && src.length > 0) {
					imageUrls.push(src);
				}
			}
		});
	}
	
	// First image URL (for backward compatibility)
	const imageUrl = imageUrls.length > 0 ? imageUrls[0] : undefined;

	// Log image extraction for debugging
	if (!imageUrl) {
		console.log('[ProductMapper] No image found for product:', {
			id: product.id,
			name: product.name,
			hasImages: !!product.images,
			imagesLength: product.images?.length || 0,
		});
	}

	// Extract category name and ID (use first category)
	const category =
		product.categories && product.categories.length > 0
			? product.categories[0].name
			: undefined;
	const categoryId =
		product.categories && product.categories.length > 0
			? product.categories[0].id
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

	// Extract GC codes from meta_data
	let gcNumbers: string[] = [];
	let gcNumber: string | undefined; // For backward compatibility
	
	if (product.meta_data && Array.isArray(product.meta_data)) {
		const gcCodeValue = getMetaFieldValue(product.meta_data, 'gc_code');
		if (gcCodeValue) {
			gcNumbers = parseGcCodes(gcCodeValue);
			// Set first GC code for backward compatibility
			if (gcNumbers.length > 0) {
				gcNumber = gcNumbers[0];
			}
		}
	}
	
	// Fallback: Extract GC number from SKU if not found in meta_data
	if (gcNumbers.length === 0 && product.sku) {
		const gcMatch = product.sku.match(/GC[- ]?(\d+)/i);
		if (gcMatch) {
			gcNumber = gcMatch[1];
			gcNumbers = [gcNumber];
		}
	}

	// Extract part number from meta_data (preferred) or use SKU as fallback
	let partNumber: string;
	if (product.meta_data && Array.isArray(product.meta_data)) {
		const partNumberValue = getMetaFieldValue(product.meta_data, 'part_number');
		if (partNumberValue && typeof partNumberValue === 'string' && partNumberValue.trim()) {
			partNumber = partNumberValue.trim();
		} else {
			partNumber = product.sku || String(product.id);
		}
	} else {
		partNumber = product.sku || String(product.id);
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
		partNumber,
		gcNumber, // For backward compatibility
		gcNumbers: gcNumbers.length > 0 ? gcNumbers : undefined,
		name: product.name,
		description: cleanDescription || undefined,
		manufacturer,
		category,
		categoryId,
		price,
		inStock,
		imageUrl, // For backward compatibility
		imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
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
