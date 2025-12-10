/**
 * WooCommerce API Service
 * Handles all API calls to WooCommerce REST API
 */

import Constants from 'expo-constants';

// WooCommerce API Configuration
const getWooCommerceConfig = () => {
	const baseUrl =
		process.env.EXPO_PUBLIC_WOOCOMMERCE_BASE_URL ||
		Constants.expoConfig?.extra?.woocommerceBaseUrl;
	const consumerKey =
		process.env.EXPO_PUBLIC_WOOCOMMERCE_CONSUMER_KEY ||
		Constants.expoConfig?.extra?.woocommerceConsumerKey;
	const consumerSecret =
		process.env.EXPO_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET ||
		Constants.expoConfig?.extra?.woocommerceConsumerSecret;

	if (!baseUrl || !consumerKey || !consumerSecret) {
		throw new Error(
			'WooCommerce API credentials not configured. Please set EXPO_PUBLIC_WOOCOMMERCE_BASE_URL, EXPO_PUBLIC_WOOCOMMERCE_CONSUMER_KEY, and EXPO_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET in your .env file.'
		);
	}

	// Normalize base URL (remove trailing slash)
	const normalizedUrl = baseUrl.replace(/\/$/, '');

	return {
		baseUrl: normalizedUrl,
		consumerKey,
		consumerSecret,
	};
};

/**
 * WooCommerce Product interface (based on WooCommerce REST API v3)
 */
export interface WooCommerceProduct {
	id: number;
	name: string;
	slug: string;
	permalink: string;
	date_created: string;
	date_modified: string;
	type: string;
	status: string;
	featured: boolean;
	catalog_visibility: string;
	description: string;
	short_description: string;
	sku: string;
	price: string;
	regular_price: string;
	sale_price: string;
	date_on_sale_from: string | null;
	date_on_sale_to: string | null;
	on_sale: boolean;
	purchasable: boolean;
	total_sales: number;
	virtual: boolean;
	downloadable: boolean;
	downloads: any[];
	download_limit: number;
	download_expiry: number;
	external_url: string;
	button_text: string;
	tax_status: string;
	tax_class: string;
	manage_stock: boolean;
	stock_quantity: number | null;
	stock_status: 'instock' | 'outofstock' | 'onbackorder';
	backorders: string;
	backorders_allowed: boolean;
	backordered: boolean;
	sold_individually: boolean;
	weight: string;
	dimensions: {
		length: string;
		width: string;
		height: string;
	};
	shipping_required: boolean;
	shipping_taxable: boolean;
	shipping_class: string;
	shipping_class_id: number;
	reviews_allowed: boolean;
	average_rating: string;
	rating_count: number;
	related_ids: number[];
	upsell_ids: number[];
	cross_sell_ids: number[];
	parent_id: number;
	purchase_note: string;
	categories: Array<{
		id: number;
		name: string;
		slug: string;
	}>;
	tags: Array<{
		id: number;
		name: string;
		slug: string;
	}>;
	images: Array<{
		id: number;
		src: string;
		name: string;
		alt: string;
	}>;
	attributes: any[];
	default_attributes: any[];
	variations: number[];
	grouped_products: number[];
	menu_order: number;
	meta_data: any[];
	_links: any;
}

/**
 * WooCommerce Category interface
 */
export interface WooCommerceCategory {
	id: number;
	name: string;
	slug: string;
	parent: number;
	description: string;
	display: string;
	image: {
		id: number;
		src: string;
		name: string;
		alt: string;
	} | null;
	menu_order: number;
	count: number;
	_links: any;
}

/**
 * Base64 encode helper for React Native
 * Uses a reliable base64 encoding implementation
 */
const base64Encode = (str: string): string => {
	try {
		// Try native btoa if available (web environment)
		if (typeof global.btoa === 'function') {
			return global.btoa(str);
		}
		// Use Buffer if available (Node.js/Expo environment)
		if (typeof Buffer !== 'undefined') {
			return Buffer.from(str, 'utf8').toString('base64');
		}
		// Manual base64 encoding implementation
		const chars =
			'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
		let output = '';
		let i = 0;

		while (i < str.length) {
			const a = str.charCodeAt(i++);
			const b = i < str.length ? str.charCodeAt(i++) : 0;
			const c = i < str.length ? str.charCodeAt(i++) : 0;

			const bitmap = (a << 16) | (b << 8) | c;

			output += chars.charAt((bitmap >> 18) & 63);
			output += chars.charAt((bitmap >> 12) & 63);
			output += i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : '=';
			output += i - 1 < str.length ? chars.charAt(bitmap & 63) : '=';
		}

		return output;
	} catch (error) {
		throw new Error('Failed to encode credentials for WooCommerce API');
	}
};

/**
 * Build Basic Auth header for WooCommerce API
 */
const getAuthHeader = (): string => {
	const { consumerKey, consumerSecret } = getWooCommerceConfig();
	const credentials = `${consumerKey}:${consumerSecret}`;
	return `Basic ${base64Encode(credentials)}`;
};

/**
 * Make API request to WooCommerce
 */
const apiRequest = async <T>(
	endpoint: string,
	params?: Record<string, any>
): Promise<T> => {
	const { baseUrl } = getWooCommerceConfig();
	const authHeader = getAuthHeader();

	// Build query string
	const queryParams = new URLSearchParams();
	if (params) {
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				queryParams.append(key, String(value));
			}
		});
	}

	const url = `${baseUrl}/wp-json/wc/v3/${endpoint}${
		queryParams.toString() ? `?${queryParams.toString()}` : ''
	}`;

	try {
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				Authorization: authHeader,
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				`WooCommerce API error: ${response.status} ${
					response.statusText
				}. ${JSON.stringify(errorData)}`
			);
		}

		return await response.json();
	} catch (error) {
		if (error instanceof Error) {
			throw error;
		}
		throw new Error('Failed to fetch data from WooCommerce API');
	}
};

/**
 * List all products with optional search and filters
 * @param params Search parameters
 * @returns Array of WooCommerce products
 */
export async function listProducts(params?: {
	page?: number;
	per_page?: number;
	search?: string;
	category?: number;
	sku?: string;
	status?: string;
	stock_status?: string;
}): Promise<WooCommerceProduct[]> {
	const queryParams: Record<string, any> = {
		page: params?.page || 1,
		per_page: params?.per_page || 100,
	};

	if (params?.search) {
		queryParams.search = params.search;
	}
	if (params?.category) {
		queryParams.category = params.category;
	}
	if (params?.sku) {
		queryParams.sku = params.sku;
	}
	if (params?.status) {
		queryParams.status = params.status;
	}
	if (params?.stock_status) {
		queryParams.stock_status = params.stock_status;
	}

	return apiRequest<WooCommerceProduct[]>('products', queryParams);
}

/**
 * Get a single product by ID
 * @param id Product ID
 * @returns WooCommerce product
 */
export async function getProduct(id: number): Promise<WooCommerceProduct> {
	return apiRequest<WooCommerceProduct>(`products/${id}`);
}

/**
 * List all product categories
 * @param params Query parameters
 * @returns Array of WooCommerce categories
 */
export async function listCategories(params?: {
	page?: number;
	per_page?: number;
	search?: string;
	parent?: number;
}): Promise<WooCommerceCategory[]> {
	const queryParams: Record<string, any> = {
		page: params?.page || 1,
		per_page: params?.per_page || 100,
	};

	if (params?.search) {
		queryParams.search = params.search;
	}
	if (params?.parent !== undefined) {
		queryParams.parent = params.parent;
	}

	return apiRequest<WooCommerceCategory[]>('products/categories', queryParams);
}

/**
 * Get a single category by ID
 * @param id Category ID
 * @returns WooCommerce category
 */
export async function getCategory(id: number): Promise<WooCommerceCategory> {
	return apiRequest<WooCommerceCategory>(`products/categories/${id}`);
}
