/**
 * WooCommerce Customer Service
 * Handles guest customer creation and management
 * Creates a customer in WooCommerce for tracking orders without requiring login
 */

import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CUSTOMER_ID_KEY = 'woocommerce_customer_id';

// WooCommerce API Configuration
const getWooCommerceConfig = () => {
	// Base URL can be public (EXPO_PUBLIC_ prefix is fine for non-secrets)
	const baseUrl =
		process.env.EXPO_PUBLIC_WOOCOMMERCE_BASE_URL ||
		Constants.expoConfig?.extra?.woocommerceBaseUrl;
	
	// Consumer key and secret are secrets - must use Constants.expoConfig.extra (populated from app.config.js)
	// Do NOT use EXPO_PUBLIC_ prefix for secrets as they would be exposed in the client bundle
	// In Expo, non-EXPO_PUBLIC_ process.env variables are NOT available in client-side code
	// They must be loaded via app.config.js and accessed through Constants.expoConfig.extra
	const consumerKey = Constants.expoConfig?.extra?.woocommerceConsumerKey;
	const consumerSecret = Constants.expoConfig?.extra?.woocommerceConsumerSecret;

	if (!baseUrl || !consumerKey || !consumerSecret) {
		throw new Error(
			'WooCommerce API credentials not configured. Please set:\n' +
			'- EXPO_PUBLIC_WOOCOMMERCE_BASE_URL in .env file (or via EAS secret)\n' +
			'- WOOCOMMERCE_CONSUMER_KEY via EAS secret (use: eas secret:create --scope project --name WOOCOMMERCE_CONSUMER_KEY --value your_key)\n' +
			'- WOOCOMMERCE_CONSUMER_SECRET via EAS secret (use: eas secret:create --scope project --name WOOCOMMERCE_CONSUMER_SECRET --value your_secret)'
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
 * Base64 encode helper for React Native
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
 * WooCommerce Customer interface
 */
export interface WooCommerceCustomer {
	id: number;
	date_created: string;
	date_modified: string;
	email: string;
	first_name: string;
	last_name: string;
	role: string;
	username: string;
	billing?: {
		first_name: string;
		last_name: string;
		company: string;
		address_1: string;
		address_2: string;
		city: string;
		state: string;
		postcode: string;
		country: string;
		email: string;
		phone: string;
	};
	shipping?: {
		first_name: string;
		last_name: string;
		company: string;
		address_1: string;
		address_2: string;
		city: string;
		state: string;
		postcode: string;
		country: string;
	};
	is_paying_customer: boolean;
	orders_count: number;
	total_spent: string;
	avatar_url: string;
	meta_data: any[];
	_links: any;
}

/**
 * Create Customer Request interface
 */
export interface CreateCustomerRequest {
	email?: string;
	first_name?: string;
	last_name?: string;
	username?: string;
	password?: string;
	billing?: {
		first_name?: string;
		last_name?: string;
		company?: string;
		address_1?: string;
		address_2?: string;
		city?: string;
		state?: string;
		postcode?: string;
		country?: string;
		email?: string;
		phone?: string;
	};
	shipping?: {
		first_name?: string;
		last_name?: string;
		company?: string;
		address_1?: string;
		address_2?: string;
		city?: string;
		state?: string;
		postcode?: string;
		country?: string;
	};
}

/**
 * Make API request to WooCommerce Customers API
 */
const apiRequest = async <T>(
	endpoint: string,
	method: 'GET' | 'POST' | 'PUT' = 'GET',
	body?: any
): Promise<T> => {
	const { baseUrl } = getWooCommerceConfig();
	const authHeader = getAuthHeader();

	const url = `${baseUrl}/wp-json/wc/v3/${endpoint}`;

	console.log('[WooCommerce Customer API] Request:', {
		endpoint,
		url,
		method,
		hasBody: !!body,
	});

	try {
		const requestOptions: RequestInit = {
			method,
			headers: {
				Authorization: authHeader,
				'Content-Type': 'application/json',
			},
		};

		if (body && method === 'POST') {
			requestOptions.body = JSON.stringify(body);
		}

		const response = await fetch(url, requestOptions);

		console.log('[WooCommerce Customer API] Response:', {
			status: response.status,
			statusText: response.statusText,
			ok: response.ok,
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			console.error('[WooCommerce Customer API] Error Response:', errorData);
			throw new Error(
				`WooCommerce Customer API error: ${response.status} ${
					response.statusText
				}. ${JSON.stringify(errorData)}`
			);
		}

		const data = await response.json();
		console.log('[WooCommerce Customer API] Success:', {
			endpoint,
			method,
			dataType: Array.isArray(data) ? 'array' : typeof data,
		});

		return data;
	} catch (error) {
		console.error('[WooCommerce Customer API] Exception:', {
			endpoint,
			url,
			method,
			error: error instanceof Error ? error.message : String(error),
		});
		if (error instanceof Error) {
			throw error;
		}
		throw new Error('Failed to make request to WooCommerce Customer API');
	}
};

/**
 * Generate a unique guest email based on device ID
 * Format: guest-{timestamp}-{random}@hssspares.local
 */
const generateGuestEmail = (): string => {
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 9);
	return `guest-${timestamp}-${random}@hssspares.local`;
};

/**
 * Generate a unique guest username
 * Format: guest_{timestamp}_{random}
 */
const generateGuestUsername = (): string => {
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 9);
	return `guest_${timestamp}_${random}`;
};

/**
 * Create a guest customer in WooCommerce
 * @returns Created customer ID
 */
async function createGuestCustomer(): Promise<number> {
	try {
		const guestEmail = generateGuestEmail();
		const guestUsername = generateGuestUsername();

		const customerData: CreateCustomerRequest = {
			email: guestEmail,
			username: guestUsername,
			first_name: 'Guest',
			last_name: 'Customer',
		};

		console.log('[Customer] Creating guest customer:', {
			email: guestEmail,
			username: guestUsername,
		});

		const customer = await apiRequest<WooCommerceCustomer>(
			'customers',
			'POST',
			customerData
		);

		console.log('[Customer] Guest customer created:', {
			customerId: customer.id,
			email: customer.email,
		});

		// Store customer ID locally
		await AsyncStorage.setItem(CUSTOMER_ID_KEY, customer.id.toString());

		return customer.id;
	} catch (error) {
		console.error('[Customer] Error creating guest customer:', error);
		throw error;
	}
}

/**
 * Get or create a customer ID for this device
 * Returns the stored customer ID, or creates a new guest customer if none exists
 * @returns Customer ID
 */
export async function getOrCreateCustomerId(): Promise<number> {
	try {
		// Try to get existing customer ID from storage
		const storedCustomerId = await AsyncStorage.getItem(CUSTOMER_ID_KEY);

		if (storedCustomerId) {
			const customerId = parseInt(storedCustomerId, 10);
			if (!isNaN(customerId) && customerId > 0) {
				console.log('[Customer] Using existing customer ID:', customerId);

				// Verify customer still exists in WooCommerce
				try {
					await apiRequest<WooCommerceCustomer>(
						`customers/${customerId}`,
						'GET'
					);
					return customerId;
				} catch (error) {
					console.warn(
						'[Customer] Stored customer ID not found in WooCommerce, creating new customer',
						error
					);
					// Customer doesn't exist, create a new one
					return await createGuestCustomer();
				}
			}
		}

		// No stored customer ID, create a new guest customer
		console.log(
			'[Customer] No existing customer ID, creating new guest customer'
		);
		return await createGuestCustomer();
	} catch (error) {
		console.error('[Customer] Error getting or creating customer ID:', error);
		throw error;
	}
}

/**
 * Get the current customer ID from storage (if exists)
 * Returns null if no customer ID is stored
 * @returns Customer ID or null
 */
export async function getCustomerId(): Promise<number | null> {
	try {
		const storedCustomerId = await AsyncStorage.getItem(CUSTOMER_ID_KEY);
		if (storedCustomerId) {
			const customerId = parseInt(storedCustomerId, 10);
			if (!isNaN(customerId) && customerId > 0) {
				return customerId;
			}
		}
		return null;
	} catch (error) {
		console.error('[Customer] Error getting customer ID:', error);
		return null;
	}
}

/**
 * Get customer details from WooCommerce
 * @param customerId Customer ID
 * @returns Customer details
 */
export async function getCustomer(
	customerId: number
): Promise<WooCommerceCustomer> {
	try {
		return await apiRequest<WooCommerceCustomer>(
			`customers/${customerId}`,
			'GET'
		);
	} catch (error) {
		console.error('[Customer] Error getting customer:', error);
		throw error;
	}
}
