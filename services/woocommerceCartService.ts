/**
 * WooCommerce Store API Cart Service
 * Handles cart operations using the Store API (not REST API)
 * Follows cart token authentication as per WooCommerce Store API docs
 */

import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BasketItem } from './basketService';

const CART_TOKEN_KEY = 'woocommerce_cart_token';

// WooCommerce Store API Configuration
const getWooCommerceConfig = () => {
	const baseUrl =
		process.env.EXPO_PUBLIC_WOOCOMMERCE_BASE_URL ||
		Constants.expoConfig?.extra?.woocommerceBaseUrl;

	if (!baseUrl) {
		throw new Error(
			'WooCommerce base URL not configured. Please set EXPO_PUBLIC_WOOCOMMERCE_BASE_URL in your .env file.'
		);
	}

	// Normalize base URL (remove trailing slash)
	const normalizedUrl = baseUrl.replace(/\/$/, '');

	return {
		baseUrl: normalizedUrl,
		storeApiBaseUrl: `${normalizedUrl}/wp-json/wc/store/v1`,
	};
};

/**
 * Cart response from WooCommerce Store API
 */
export interface WooCommerceCartResponse {
	items: Array<{
		key: string;
		id: number;
		quantity: number;
		name: string;
		[key: string]: any;
	}>;
	coupons: any[];
	fees: any[];
	totals: {
		total_items: string;
		total_items_tax: string;
		total_fees: string;
		total_fees_tax: string;
		total_discount: string;
		total_discount_tax: string;
		total_shipping: string;
		total_shipping_tax: string;
		total_price: string;
		total_tax: string;
		currency_code: string;
		currency_symbol: string;
		[key: string]: any;
	};
	[key: string]: any;
}

/**
 * Store cart token in AsyncStorage
 */
async function storeCartToken(token: string): Promise<void> {
	try {
		await AsyncStorage.setItem(CART_TOKEN_KEY, token);
	} catch (error) {
		console.error('[Cart Service] Error storing cart token:', error);
		throw error;
	}
}

/**
 * Retrieve cart token from AsyncStorage
 */
async function getStoredCartToken(): Promise<string | null> {
	try {
		return await AsyncStorage.getItem(CART_TOKEN_KEY);
	} catch (error) {
		console.error('[Cart Service] Error retrieving cart token:', error);
		return null;
	}
}

/**
 * Clear stored cart token
 */
async function clearCartToken(): Promise<void> {
	try {
		await AsyncStorage.removeItem(CART_TOKEN_KEY);
	} catch (error) {
		console.error('[Cart Service] Error clearing cart token:', error);
	}
}

/**
 * Get or create a cart token by making a GET request to the cart endpoint
 * The cart token is returned in the response headers
 */
async function getOrCreateCartToken(): Promise<string> {
	try {
		const { storeApiBaseUrl } = getWooCommerceConfig();
		const storedToken = await getStoredCartToken();

		// Try to use stored token first
		if (storedToken) {
			// Verify token is still valid by making a request
			try {
				const response = await fetch(`${storeApiBaseUrl}/cart`, {
					method: 'GET',
					headers: {
						'Cart-Token': storedToken,
						'Content-Type': 'application/json',
					},
				});

				if (response.ok) {
					// Token is valid, extract and update if new token provided
					const newToken = response.headers.get('Cart-Token');
					if (newToken && newToken !== storedToken) {
						await storeCartToken(newToken);
						return newToken;
					}
					return storedToken;
				}
			} catch (error) {
				// Token might be invalid, continue to get a new one
				console.log('[Cart Service] Stored token invalid, getting new token');
			}
		}

		// Get a new cart token
		const response = await fetch(`${storeApiBaseUrl}/cart`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				`Failed to get cart token: ${response.status} ${
					response.statusText
				}. ${JSON.stringify(errorData)}`
			);
		}

		// Extract cart token from response headers
		const cartToken = response.headers.get('Cart-Token');
		if (!cartToken) {
			throw new Error('Cart token not found in response headers');
		}

		// Store the token for future use
		await storeCartToken(cartToken);

		console.log(
			'[Cart Service] Cart token obtained:',
			cartToken.substring(0, 20) + '...'
		);

		return cartToken;
	} catch (error) {
		console.error('[Cart Service] Error getting cart token:', error);
		throw error;
	}
}

/**
 * Get current cart from WooCommerce
 */
export async function getCart(): Promise<WooCommerceCartResponse> {
	try {
		const { storeApiBaseUrl } = getWooCommerceConfig();
		const cartToken = await getOrCreateCartToken();

		const response = await fetch(`${storeApiBaseUrl}/cart`, {
			method: 'GET',
			headers: {
				'Cart-Token': cartToken,
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				`Failed to get cart: ${response.status} ${
					response.statusText
				}. ${JSON.stringify(errorData)}`
			);
		}

		// Update token if a new one is provided
		const newToken = response.headers.get('Cart-Token');
		if (newToken && newToken !== cartToken) {
			await storeCartToken(newToken);
		}

		const cart = await response.json();
		return cart;
	} catch (error) {
		console.error('[Cart Service] Error getting cart:', error);
		throw error;
	}
}

/**
 * Add an item to the WooCommerce cart
 */
export async function addItemToCart(
	productId: number,
	quantity: number = 1
): Promise<WooCommerceCartResponse> {
	try {
		const { storeApiBaseUrl } = getWooCommerceConfig();
		const cartToken = await getOrCreateCartToken();

		// Build query parameters
		const params = new URLSearchParams({
			id: productId.toString(),
			quantity: quantity.toString(),
		});

		const response = await fetch(
			`${storeApiBaseUrl}/cart/add-item?${params.toString()}`,
			{
				method: 'POST',
				headers: {
					'Cart-Token': cartToken,
					'Content-Type': 'application/json',
				},
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				`Failed to add item to cart: ${response.status} ${
					response.statusText
				}. ${JSON.stringify(errorData)}`
			);
		}

		// Update token if a new one is provided
		const newToken = response.headers.get('Cart-Token');
		if (newToken && newToken !== cartToken) {
			await storeCartToken(newToken);
		}

		const cart = await response.json();
		return cart;
	} catch (error) {
		console.error('[Cart Service] Error adding item to cart:', error);
		throw error;
	}
}

/**
 * Sync local basket items to WooCommerce cart
 * This will add all items from the local basket to the WooCommerce cart
 *
 * @returns Cart response with updated cart token in headers
 */
export async function syncBasketToCart(
	basketItems: BasketItem[]
): Promise<WooCommerceCartResponse> {
	try {
		if (!basketItems || basketItems.length === 0) {
			throw new Error('Cannot sync empty basket to cart');
		}

		console.log('[Cart Service] Syncing basket to cart:', {
			itemCount: basketItems.length,
		});

		// Clear existing cart first (optional - you might want to merge instead)
		// For now, we'll just add items - WooCommerce will handle duplicates

		// Add each basket item to the cart
		let lastCartResponse: WooCommerceCartResponse | null = null;
		for (const item of basketItems) {
			const productId = parseInt(item.id, 10);
			if (isNaN(productId)) {
				console.warn(
					`[Cart Service] Skipping item with invalid product ID: ${item.id}`
				);
				continue;
			}

			console.log('[Cart Service] Adding item to cart:', {
				productId,
				quantity: item.quantity,
				name: item.name,
			});

			lastCartResponse = await addItemToCart(productId, item.quantity);
		}

		if (!lastCartResponse) {
			throw new Error('Failed to sync any items to cart');
		}

		console.log('[Cart Service] Basket synced to cart successfully:', {
			totalItems: lastCartResponse.items.length,
			totalPrice: lastCartResponse.totals.total_price,
		});

		return lastCartResponse;
	} catch (error) {
		console.error('[Cart Service] Error syncing basket to cart:', error);
		throw error;
	}
}

/**
 * Get the current cart token (useful after syncing)
 *
 * @returns Current cart token
 */
export async function getCurrentCartToken(): Promise<string> {
	return await getOrCreateCartToken();
}

/**
 * Get the WooCommerce checkout bridge URL with cart token
 * This URL bridges the Store API cart token to the web checkout session
 *
 * @param cartToken Optional cart token. If not provided, will retrieve current token
 * @returns Checkout bridge URL with cart token parameter
 */
export async function getCheckoutUrl(cartToken?: string): Promise<string> {
	const { baseUrl } = getWooCommerceConfig();

	// Get cart token if not provided
	let token = cartToken;
	if (!token) {
		token = await getOrCreateCartToken();
	}

	// Use checkout-bridge endpoint to transfer cart to web session
	return `${baseUrl}/checkout-bridge/?cart_token=${encodeURIComponent(token)}`;
}

/**
 * Clear the cart token (useful for logout or reset)
 */
export async function clearCart(): Promise<void> {
	await clearCartToken();
}
