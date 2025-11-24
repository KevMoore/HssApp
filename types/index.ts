/**
 * Type definitions for HSS Spares app
 */

export interface Part {
	id: string;
	partNumber: string;
	gcNumber?: string;
	name: string;
	description?: string;
	manufacturer: string;
	category?: string;
	price?: number;
	inStock: boolean;
	imageUrl?: string;
	compatibleWith?: string[]; // List of appliance models this part fits
}

export interface SearchFilters {
	manufacturer?: string;
	category?: string;
	inStockOnly?: boolean;
}

export interface SearchParams {
	query: string;
	filters?: SearchFilters;
}

export type SearchMode = 'appliance' | 'part' | 'keyword';
