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
    description: 'Genuine Worcester Bosch circulation pump for Greenstar boilers',
    manufacturer: 'Worcester Bosch',
    category: 'Pumps',
    price: 89.99,
    inStock: true,
  },
  {
    id: '2',
    partNumber: 'VA-67890',
    name: 'Vaillant Heat Exchanger',
    description: 'Replacement heat exchanger for Vaillant ecoTEC boilers',
    manufacturer: 'Vaillant',
    category: 'Heat Exchangers',
    price: 245.00,
    inStock: true,
  },
  {
    id: '3',
    partNumber: 'GL-11111',
    name: 'GlowWorm PCB',
    description: 'Printed circuit board for GlowWorm Ultracom boilers',
    manufacturer: 'GlowWorm',
    category: 'Electronics',
    price: 189.50,
    inStock: false,
  },
  {
    id: '4',
    partNumber: 'ID-22222',
    name: 'Ideal Gas Valve',
    description: 'Gas valve assembly for Ideal Logic boilers',
    manufacturer: 'Ideal',
    category: 'Valves',
    price: 125.00,
    inStock: true,
  },
  {
    id: '5',
    partNumber: 'BA-33333',
    name: 'Baxi Fan',
    description: 'Combustion fan for Baxi Main boilers',
    manufacturer: 'Baxi',
    category: 'Fans',
    price: 95.00,
    inStock: true,
  },
];

/**
 * Search for parts based on query and filters
 */
export async function searchParts(params: SearchParams): Promise<Part[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const { query, filters } = params;
  const queryLower = query.toLowerCase().trim();

  if (!queryLower) {
    return [];
  }

  let results = mockParts.filter((part) => {
    const matchesQuery =
      part.partNumber.toLowerCase().includes(queryLower) ||
      part.gcNumber?.toLowerCase().includes(queryLower) ||
      part.name.toLowerCase().includes(queryLower) ||
      part.description?.toLowerCase().includes(queryLower) ||
      part.manufacturer.toLowerCase().includes(queryLower);

    if (!matchesQuery) {
      return false;
    }

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
  });

  return results;
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

