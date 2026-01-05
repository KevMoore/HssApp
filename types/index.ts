/**
 * Type definitions for HSS Spares app
 */

export interface Part {
	id: string;
	partNumber: string;
	gcNumber?: string; // Single GC number (for backward compatibility)
	gcNumbers?: string[]; // Multiple GC codes from meta_data
	name: string;
	description?: string;
	manufacturer: string;
	category?: string;
	categoryId?: number; // Category ID for image lookup
	price?: number;
	inStock: boolean;
	imageUrl?: string; // First image URL (for backward compatibility)
	imageUrls?: string[]; // All image URLs
	compatibleWith?: string[]; // List of appliance models this part fits
}

export type StockStatusFilter = 'all' | 'inStock' | 'outOfStock';

export type PriceRangeFilter =
	| 'all'
	| 'under10'
	| '10to25'
	| '25to50'
	| '50to100'
	| '100to250'
	| 'over250';

export interface SearchFilters {
	manufacturer?: string;
	category?: string;
	inStockOnly?: boolean; // Deprecated - use stockStatus instead
	stockStatus?: StockStatusFilter;
	priceRange?: PriceRangeFilter;
}

export interface SearchParams {
	query: string;
	filters?: SearchFilters;
}

export type SearchMode = 'appliance' | 'part' | 'keyword';
