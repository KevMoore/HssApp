/**
 * Parts search service
 * This service handles parts search functionality
 * For now, it uses mock data. In the future, this can be connected to the HSS API
 */

import { Part, SearchParams } from '../types';

// Mock data for demonstration
const mockParts: Part[] = [
	{
		id: '1',
		partNumber: 'WB-12345',
		gcNumber: 'GC123456',
		name: 'Worcester Bosch Pump',
		description:
			'Genuine Worcester Bosch circulation pump for Greenstar boilers',
		manufacturer: 'Worcester Bosch',
		category: 'Pumps',
		price: 89.99,
		inStock: true,
		imageUrl:
			'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=400&fit=crop&q=80',
		compatibleWith: [
			'Greenstar 24i',
			'Greenstar 30i',
			'Greenstar 34i',
			'Greenstar 42i',
			'Greenstar Ri',
		],
	},
	{
		id: '2',
		partNumber: 'VA-67890',
		name: 'Vaillant Heat Exchanger',
		description: 'Replacement heat exchanger for Vaillant ecoTEC boilers',
		manufacturer: 'Vaillant',
		category: 'Heat Exchangers',
		price: 245.0,
		inStock: true,
		imageUrl:
			'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&q=80',
		compatibleWith: [
			'ecoTEC plus 824',
			'ecoTEC plus 831',
			'ecoTEC plus 837',
			'ecoTEC pro 28',
			'ecoTEC pro 31',
		],
	},
	{
		id: '3',
		partNumber: '0020027604',
		name: 'DISPLAY BOARD TC',
		description: 'Display board for GlowWorm boilers',
		manufacturer: 'GlowWorm',
		category: 'Electronics',
		price: undefined,
		inStock: false,
		imageUrl:
			'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop&q=80',
	},
	{
		id: '6',
		partNumber: '0020186152',
		name: '12 PLATE HEAT EXCHANGER',
		description: '12 plate heat exchanger for GlowWorm boilers',
		manufacturer: 'GlowWorm',
		category: 'Heat Exchangers',
		price: 78.15,
		inStock: true,
		imageUrl:
			'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&q=80',
	},
	{
		id: '7',
		partNumber: '0020186153',
		name: '14 PLATE HEAT EXCHANGER',
		description: '14 plate heat exchanger for GlowWorm boilers',
		manufacturer: 'GlowWorm',
		category: 'Heat Exchangers',
		price: 83.99,
		inStock: true,
		imageUrl:
			'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&q=80',
	},
	{
		id: '8',
		partNumber: 'S1076600',
		name: '3 WAY VALVE / HEAT EXCHANGER PIPE',
		description:
			'3 way valve and heat exchanger pipe assembly for GlowWorm boilers',
		manufacturer: 'GlowWorm',
		category: 'Valves',
		price: 67.78,
		inStock: true,
		imageUrl:
			'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&h=400&fit=crop&q=80',
	},
	{
		id: '9',
		partNumber: '0020018574',
		name: '3 WAY VALVE ASSEMBLY',
		description: '3 way valve assembly for GlowWorm boilers',
		manufacturer: 'GlowWorm',
		category: 'Valves',
		price: 242.0,
		inStock: true,
		imageUrl:
			'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&h=400&fit=crop&q=80',
	},
	{
		id: '10',
		partNumber: '0020136956',
		name: '3 WAY VALVE CARTRIDGE',
		description: '3 way valve cartridge for GlowWorm boilers',
		manufacturer: 'GlowWorm',
		category: 'Valves',
		price: 79.39,
		inStock: true,
		imageUrl:
			'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&h=400&fit=crop&q=80',
	},
	{
		id: '11',
		partNumber: '0020118640',
		name: '3 WAY VALVE MOTOR',
		description: '3 way valve motor for GlowWorm boilers',
		manufacturer: 'GlowWorm',
		category: 'Valves',
		price: 69.17,
		inStock: true,
		imageUrl:
			'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&h=400&fit=crop&q=80',
	},
	{
		id: '12',
		partNumber: 'S5720600',
		name: '3 WAY VALVE MOTOR',
		description: '3 way valve motor for GlowWorm boilers',
		manufacturer: 'GlowWorm',
		category: 'Valves',
		price: 51.15,
		inStock: true,
		imageUrl:
			'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&h=400&fit=crop&q=80',
	},
	{
		id: '13',
		partNumber: '0020042355',
		name: '24 LPG CONVERSION KIT A00200075',
		description: 'LPG conversion kit for GlowWorm boilers',
		manufacturer: 'GlowWorm',
		category: 'Kits',
		price: undefined,
		inStock: false,
		imageUrl:
			'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&q=80',
	},
	{
		id: '4',
		partNumber: 'ID-22222',
		name: 'Ideal Gas Valve',
		description: 'Gas valve assembly for Ideal Logic boilers',
		manufacturer: 'Ideal',
		category: 'Valves',
		price: 125.0,
		inStock: true,
		imageUrl:
			'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&h=400&fit=crop&q=80',
	},
	{
		id: '5',
		partNumber: 'BA-33333',
		name: 'Baxi Fan',
		description: 'Combustion fan for Baxi Main boilers',
		manufacturer: 'Baxi',
		category: 'Fans',
		price: 95.0,
		inStock: true,
		imageUrl:
			'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=400&fit=crop&q=80',
		compatibleWith: [
			'100/2HE PLUS',
			'100HE PLUS',
			'COMBI 100 HE PLUS',
			'COMBI 80 HE PLUS',
			'Platinum 15 HE',
			'Platinum 24 HE',
			'Solo HE & HE A 12HE',
			'Solo HE & HE A 15HE',
			'Solo HE & HE A 18HE',
			'Solo HE & HE A 24HE',
			'Solo HE & HE A 30HE',
		],
	},
];

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
	// Simulate API delay
	await new Promise((resolve) => setTimeout(resolve, 500));

	const { query, filters } = params;
	const queryLower = query.toLowerCase().trim();

	if (!queryLower) {
		return [];
	}

	// Calculate relevance scores and filter
	const scoredParts = mockParts
		.map((part) => ({
			part,
			score: calculateRelevanceScore(part, queryLower),
		}))
		.filter(({ part, score }) => {
			// Only include parts with a score > 0 (i.e., matched the query)
			if (score === 0) {
				return false;
			}

			// Apply filters
			if (filters?.manufacturer && part.manufacturer !== filters.manufacturer) {
				return false;
			}

			if (filters?.category && part.category !== filters.category) {
				return false;
			}

			if (filters?.inStockOnly && !part.inStock) {
				return false;
			}

			return true;
		})
		// Sort by relevance score (highest first)
		.sort((a, b) => b.score - a.score)
		// Return just the parts
		.map(({ part }) => part);

	return scoredParts;
}

/**
 * Get popular manufacturers
 */
export function getPopularManufacturers(): string[] {
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

/**
 * Get part categories
 */
export function getCategories(): string[] {
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

/**
 * Get a single part by ID
 */
export async function getPartById(id: string): Promise<Part | null> {
	await new Promise((resolve) => setTimeout(resolve, 300));
	return mockParts.find((part) => part.id === id) || null;
}

/**
 * Get search suggestions from parts collection
 * Returns unique suggestions based on part names, part numbers, and manufacturers
 */
export async function getPartSuggestions(
	query: string,
	maxResults: number = 5
): Promise<string[]> {
	if (!query || !query.trim()) {
		return [];
	}

	const queryLower = query.trim().toLowerCase();
	const suggestions = new Set<string>();

	// Collect suggestions from parts
	for (const part of mockParts) {
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
}
