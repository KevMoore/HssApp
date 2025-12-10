/**
 * WooCommerce Store API Cart Service
 * Handles cart operations using WooCommerce Store API (Cart Tokens)
 */

import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for cart token
const CART_TOKEN_KEY = 'woocommerce_cart_token';

// WooCommerce Store API Configuration
const getStoreApiConfig = () => {
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
		storeApiUrl: `${normalizedUrl}/wp-json/wc/store/v1`,
	};
};

/**
 * WooCommerce Cart Item interface
 */
export interface WooCommerceCartItem {
	id: string; // Cart item key
	name: string;
	title: string;
	quantity: number;
	images?: Array<{
		id: number;
		src: string;
		alt: string;
	}>;
	prices: {
		price: string;
		regular_price: string;
		sale_price?: string;
		price_range?: {
			min_amount: string;
			max_amount: string;
		};
	};
	totals: {
		line_subtotal: string;
		line_subtotal_tax: string;
		line_total: string;
		line_total_tax: string;
	};
	product_id: number;
	variation_id?: number;
	sku?: string;
	permalink?: string;
}

/**
 * WooCommerce Cart interface
 */
export interface WooCommerceCart {
	token: string;
	items: WooCommerceCartItem[];
	items_count: number;
	items_weight: number;
	cross_sells: any[];
	needs_payment: boolean;
	needs_shipping: boolean;
	shipping_address: any;
	billing_address: any;
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
		tax_lines: any[];
	};
}

/**
 * Get or create a cart token
 * According to WooCommerce Store API docs, the quickest method is to make a GET request
 * to /cart endpoint and observe the Cart-Token header in the response
 * Stores the token in AsyncStorage for persistence
 */
/**
 * Get or create a cart token
 * CRITICAL: This token persists throughout the shopping session
 * - First add to cart: Creates and stores ONE token
 * - Subsequent operations: Reuses the SAME persisted token
 * - Token is only updated if API returns a new one (not recreated)
 * - Checkout uses THIS SAME token
 */
export async function getCartToken(): Promise<string> {
	try {
		// ALWAYS try to get existing token from storage first
		// This ensures we reuse the SAME token throughout the shopping session
		const storedToken = await AsyncStorage.getItem(CART_TOKEN_KEY);
		if (storedToken) {
			console.log('[Cart Token] Using persisted token', {
				token: storedToken.substring(0, 10) + '...',
			});
			// Return the stored token - don't verify it here as that might create issues
			// The API will return a new token if needed, and we'll update it then
			return storedToken;
		}

		// ONLY create a new token if we don't have one stored
		// This happens on the FIRST add to cart
		console.log(
			'[Cart Token] No stored token - creating NEW cart token (first add to cart)'
		);
		const { storeApiUrl } = getStoreApiConfig();
		const response = await fetch(`${storeApiUrl}/cart`, {
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

		// Extract Cart-Token from response headers
		const cartToken = response.headers.get('Cart-Token');

		if (!cartToken) {
			throw new Error('Cart-Token header not found in response');
		}

		console.log('[Cart Token] NEW cart token created and persisted', {
			token: cartToken.substring(0, 10) + '...',
		});

		// PERSIST this token - it will be reused for all subsequent operations
		await AsyncStorage.setItem(CART_TOKEN_KEY, cartToken);

		return cartToken;
	} catch (error) {
		console.error('[Cart Token] Error getting cart token:', error);
		throw error;
	}
}

/**
 * Get cart using cart token
 * The token can be obtained from Cart-Token header or created via POST /cart/token
 */
export async function getCart(token?: string): Promise<WooCommerceCart> {
	try {
		const cartToken = token || (await getCartToken());
		const { storeApiUrl } = getStoreApiConfig();

		const response = await fetch(`${storeApiUrl}/cart`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Cart-Token': cartToken,
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

		const cart = await response.json();

		// Extract token from response header if available
		const responseToken = response.headers.get('Cart-Token');
		if (responseToken && responseToken !== cartToken) {
			await AsyncStorage.setItem(CART_TOKEN_KEY, responseToken);
		}

		return cart;
	} catch (error) {
		console.error('Error getting cart:', error);
		throw error;
	}
}

/**
 * Add item to cart
 */
export async function addItemToCart(
	productId: number,
	quantity: number = 1,
	variationId?: number
): Promise<WooCommerceCart> {
	try {
		const cartToken = await getCartToken();
		const { storeApiUrl } = getStoreApiConfig();

		const body: any = {
			id: productId,
			quantity,
		};

		if (variationId) {
			body.variation_id = variationId;
		}

		console.log('[Add Item] Adding to cart', {
			productId,
			quantity,
			variationId,
			cartToken: cartToken.substring(0, 10) + '...',
		});

		const response = await fetch(`${storeApiUrl}/cart/add-item`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Cart-Token': cartToken,
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			console.error('[Add Item] API error', {
				status: response.status,
				statusText: response.statusText,
				errorData,
			});
			throw new Error(
				`Failed to add item to cart: ${response.status} ${
					response.statusText
				}. ${JSON.stringify(errorData)}`
			);
		}

		const cart = await response.json();

		console.log('[Add Item] Item added successfully', {
			productId,
			cartItemCount: cart.items?.length || 0,
			items: cart.items?.map((item: WooCommerceCartItem) => ({
				id: item.id,
				productId: item.product_id,
				quantity: item.quantity,
				name: item.name,
			})),
		});

		// Update token ONLY if API returns a different one
		// This ensures we keep the SAME token throughout the session
		const responseToken = response.headers.get('Cart-Token');
		if (responseToken && responseToken !== cartToken) {
			console.log(
				'[Add Item] Cart token updated by API - updating stored token',
				{
					oldToken: cartToken.substring(0, 10) + '...',
					newToken: responseToken.substring(0, 10) + '...',
				}
			);
			// Update persisted token - this is the ONE token for the session
			await AsyncStorage.setItem(CART_TOKEN_KEY, responseToken);
		} else {
			console.log('[Add Item] Using same persisted token', {
				token: cartToken.substring(0, 10) + '...',
			});
		}

		return cart;
	} catch (error) {
		console.error('Error adding item to cart:', error);
		throw error;
	}
}

/**
 * Update cart item quantity
 */
export async function updateCartItem(
	itemKey: string,
	quantity: number
): Promise<WooCommerceCart> {
	try {
		const cartToken = await getCartToken();
		const { storeApiUrl } = getStoreApiConfig();

		const response = await fetch(`${storeApiUrl}/cart/update-item`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Cart-Token': cartToken,
			},
			body: JSON.stringify({
				key: itemKey,
				quantity,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				`Failed to update cart item: ${response.status} ${
					response.statusText
				}. ${JSON.stringify(errorData)}`
			);
		}

		const cart = await response.json();

		// Extract token from response header if available
		const responseToken = response.headers.get('Cart-Token');
		if (responseToken && responseToken !== cartToken) {
			await AsyncStorage.setItem(CART_TOKEN_KEY, responseToken);
		}

		return cart;
	} catch (error) {
		console.error('Error updating cart item:', error);
		throw error;
	}
}

/**
 * Remove item from cart
 */
export async function removeCartItem(
	itemKey: string
): Promise<WooCommerceCart> {
	try {
		const cartToken = await getCartToken();
		const { storeApiUrl } = getStoreApiConfig();

		const response = await fetch(`${storeApiUrl}/cart/remove-item`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Cart-Token': cartToken,
			},
			body: JSON.stringify({
				key: itemKey,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				`Failed to remove cart item: ${response.status} ${
					response.statusText
				}. ${JSON.stringify(errorData)}`
			);
		}

		const cart = await response.json();

		// Extract token from response header if available
		const responseToken = response.headers.get('Cart-Token');
		if (responseToken && responseToken !== cartToken) {
			await AsyncStorage.setItem(CART_TOKEN_KEY, responseToken);
		}

		return cart;
	} catch (error) {
		console.error('Error removing cart item:', error);
		throw error;
	}
}

/**
 * Delete the cart token from storage
 * This should be called when the cart becomes empty to prevent token mismatches
 */
export async function deleteCartToken(): Promise<void> {
	try {
		await AsyncStorage.removeItem(CART_TOKEN_KEY);
		console.log('[Cart Token] Cart token deleted from storage');
	} catch (error) {
		console.error('[Cart Token] Error deleting cart token:', error);
		throw error;
	}
}

/**
 * Clear cart (remove all items) and delete the cart token
 * CRITICAL: When cart is cleared, we MUST delete the token to prevent mismatches
 */
export async function clearCart(): Promise<void> {
	try {
		const cartToken = await getCartToken();
		const { storeApiUrl } = getStoreApiConfig();

		// Get current cart to get all item keys
		const cart = await getCart(cartToken);

		if (!cart.items || cart.items.length === 0) {
			console.log('[Clear Cart] Cart is already empty - deleting token');
			// Even if cart is empty, delete the token to ensure clean state
			await deleteCartToken();
			return;
		}

		console.log('[Clear Cart] Removing items', {
			itemCount: cart.items.length,
		});

		// Remove all items
		for (const item of cart.items) {
			try {
				await removeCartItem(item.id);
			} catch (removeError) {
				console.warn('[Clear Cart] Failed to remove item', {
					itemId: item.id,
					error: removeError,
				});
			}
		}

		// CRITICAL: Delete the cart token after clearing cart
		// This ensures no mismatch between app state and WooCommerce state
		await deleteCartToken();

		console.log('[Clear Cart] Cart cleared successfully and token deleted');
	} catch (error) {
		console.error('Error clearing cart:', error);
		// Don't throw - if cart is already empty or doesn't exist, that's fine
		if (error instanceof Error && error.message.includes('404')) {
			console.log(
				'[Clear Cart] Cart not found (may already be empty) - deleting token'
			);
			await deleteCartToken();
			return;
		}
		throw error;
	}
}

/**
 * Check if cart is empty and clear token if needed
 * This should be called after removing items to ensure token is deleted when cart becomes empty
 * CRITICAL: When cart becomes empty, we MUST delete the token to prevent mismatches
 */
export async function checkAndClearEmptyCart(): Promise<void> {
	try {
		const cartToken = await getCartToken();
		const cart = await getCart(cartToken);

		if (!cart.items || cart.items.length === 0) {
			console.log(
				'[Cart Check] Cart is empty - clearing WooCommerce cart and deleting token'
			);
			// Cart is empty, so clear it (which will also delete the token)
			// This ensures WooCommerce cart is properly cleared and token is deleted
			await clearCart();
		}
	} catch (error) {
		console.error('[Cart Check] Error checking cart state:', error);
		// If we can't get the cart (e.g., token invalid or cart doesn't exist),
		// assume it's empty and delete token to prevent mismatches
		try {
			console.log(
				'[Cart Check] Cannot verify cart state - deleting token to prevent mismatch'
			);
			await deleteCartToken();
		} catch (deleteError) {
			console.error('[Cart Check] Error deleting token:', deleteError);
		}
	}
}

/**
 * Get cart basket/checkout URL
 * This URL opens the basket page in a WebView (for mobile app checkout)
 * CRITICAL: Uses the SAME persisted token that was used throughout the shopping session
 *
 * IMPORTANT: The cart is persisted server-side via Store API with the cart token.
 * The WebView implementation makes a Store API request before loading the page
 * to help establish the web session. The cart_token is passed as a query parameter
 * and JavaScript is injected to make additional Store API requests to bridge
 * the Store API cart token to the web session.
 *
 * Reference: https://developer.woocommerce.com/docs/apis/store-api/cart-tokens/
 *
 * @param existingCart Optional cart object to use instead of fetching again
 */
export async function getCartCheckoutUrl(
	existingCart?: WooCommerceCart
): Promise<string> {
	try {
		// Get the PERSISTED token - this is the SAME token used throughout the session
		const cartToken = await getCartToken();
		const { baseUrl } = getStoreApiConfig();

		console.log('[Checkout URL] Using persisted cart token', {
			token: cartToken.substring(0, 10) + '...',
		});

		// Use provided cart or fetch it
		const cart = existingCart || (await getCart(cartToken));
		if (!cart.items || cart.items.length === 0) {
			throw new Error('Cart is empty. Please add items before checkout.');
		}

		// Pass cart token as query parameter
		// The WebView will inject JavaScript to make Store API requests with this token
		// Using /basket/ as that's what the site uses
		const basketUrl = `${baseUrl}/basket/?cart_token=${encodeURIComponent(
			cartToken
		)}`;
		console.log('[Checkout URL] Generated basket URL with cart token', {
			url: basketUrl,
			token: cartToken.substring(0, 10) + '...',
			itemCount: cart.items.length,
			note: 'Cart token passed as query parameter for WebView session bridging',
		});

		return basketUrl;
	} catch (error) {
		console.error('[Checkout URL] Error getting cart checkout URL:', error);
		throw error;
	}
}

/**
 * Get cart token for use in WebView cookies
 */
export async function getCartTokenForWebView(): Promise<string> {
	return await getCartToken();
}

/**
 * Sync local basket items to WooCommerce cart
 * This function adds all local basket items to the WooCommerce cart
 */
export async function syncLocalBasketToWooCommerce(
	localItems: Array<{ productId: number; quantity: number }>
): Promise<WooCommerceCart> {
	console.log('[Cart Sync] ===== STARTING SYNC =====');
	console.log('[Cart Sync] Input items:', JSON.stringify(localItems, null, 2));

	try {
		if (!localItems || localItems.length === 0) {
			throw new Error('No items to sync');
		}

		// Get the PERSISTED cart token - this is the SAME token used throughout the session
		// getCartToken() will:
		// - Return stored token if it exists (reuse same token)
		// - Create new token ONLY if no stored token exists (first add)
		let cartToken = await getCartToken();
		const { storeApiUrl } = getStoreApiConfig();

		console.log('[Cart Sync] Using persisted cart token', {
			token: cartToken.substring(0, 10) + '...',
		});

		console.log('[Cart Sync] Starting sync', {
			itemCount: localItems.length,
			cartToken: cartToken.substring(0, 10) + '...',
			storeApiUrl,
		});

		// Get current cart to see what's already there
		// Use direct fetch to ensure we use the exact token
		let currentCart: WooCommerceCart;
		try {
			const currentCartResponse = await fetch(`${storeApiUrl}/cart`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Cart-Token': cartToken,
				},
			});

			if (currentCartResponse.ok) {
				currentCart = await currentCartResponse.json();
				const currentResponseToken =
					currentCartResponse.headers.get('Cart-Token');
				if (currentResponseToken && currentResponseToken !== cartToken) {
					cartToken = currentResponseToken;
					await AsyncStorage.setItem(CART_TOKEN_KEY, currentResponseToken);
				}
				console.log('[Cart Sync] Current cart state', {
					existingItemCount: currentCart.items?.length || 0,
				});
			} else {
				throw new Error(
					`Failed to get current cart: ${currentCartResponse.status}`
				);
			}
		} catch (error) {
			console.log('[Cart Sync] No existing cart, starting fresh', { error });
			currentCart = { items: [], items_count: 0 } as WooCommerceCart;
		}

		// Clear existing cart items first by removing them individually
		// Use the current cartToken (which may have been updated)
		if (currentCart.items && currentCart.items.length > 0) {
			console.log('[Cart Sync] Removing existing cart items', {
				itemCount: currentCart.items.length,
				usingToken: cartToken.substring(0, 10) + '...',
			});

			// Remove all items - collect item IDs first to avoid modification during iteration
			const itemIdsToRemove = currentCart.items.map((item) => item.id);
			let removedCount = 0;

			for (const itemId of itemIdsToRemove) {
				try {
					await removeCartItem(itemId);
					removedCount++;
					console.log('[Cart Sync] Removed item', {
						itemId,
						removedCount,
						total: itemIdsToRemove.length,
					});
				} catch (removeError) {
					console.warn('[Cart Sync] Failed to remove existing item', {
						itemId,
						error: removeError,
					});
					// Continue removing other items even if one fails
				}
			}

			console.log('[Cart Sync] Finished removing items', {
				attempted: itemIdsToRemove.length,
				removed: removedCount,
			});

			// Verify cart is cleared by fetching it again
			try {
				const verifyResponse = await fetch(`${storeApiUrl}/cart`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Cart-Token': cartToken,
					},
				});

				if (verifyResponse.ok) {
					const verifyCart = await verifyResponse.json();
					if (verifyCart.items && verifyCart.items.length > 0) {
						console.warn(
							'[Cart Sync] Cart still has items after removal attempt',
							{
								remainingItems: verifyCart.items.length,
								items: verifyCart.items.map((item: WooCommerceCartItem) => ({
									id: item.id,
									productId: item.product_id,
								})),
							}
						);
						// Try clearing again with the remaining items
						for (const remainingItem of verifyCart.items) {
							try {
								await removeCartItem(remainingItem.id);
							} catch (retryError) {
								console.warn('[Cart Sync] Failed to remove remaining item', {
									itemId: remainingItem.id,
									error: retryError,
								});
							}
						}
					} else {
						console.log('[Cart Sync] Cart successfully cleared');
					}
				}
			} catch (verifyError) {
				console.warn(
					'[Cart Sync] Could not verify cart was cleared',
					verifyError
				);
			}
		}

		// Add all local items to cart
		// Use the same cart token throughout to maintain session consistency
		// Start with the token we got from checking current cart (which may have been updated)
		let workingCartToken = cartToken;
		let lastCartResponse: WooCommerceCart | null = null;
		console.log('[Cart Sync] Starting to add items with token', {
			token: workingCartToken.substring(0, 10) + '...',
		});
		for (const item of localItems) {
			console.log('[Cart Sync] Adding item', {
				productId: item.productId,
				quantity: item.quantity,
				usingToken: workingCartToken.substring(0, 10) + '...',
			});
			try {
				// Add item using current token
				const addResponse = await fetch(`${storeApiUrl}/cart/add-item`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Cart-Token': workingCartToken,
					},
					body: JSON.stringify({
						id: item.productId,
						quantity: item.quantity,
					}),
				});

				if (!addResponse.ok) {
					const errorData = await addResponse.json().catch(() => ({}));
					console.error('[Cart Sync] Failed to add item', {
						productId: item.productId,
						status: addResponse.status,
						errorData,
					});
					throw new Error(
						`Failed to add item ${item.productId}: ${
							addResponse.status
						} ${JSON.stringify(errorData)}`
					);
				}

				const addCart = await addResponse.json();

				// Update token if it changed in response
				const responseToken = addResponse.headers.get('Cart-Token');
				if (responseToken && responseToken !== workingCartToken) {
					console.log('[Cart Sync] Cart token updated during add', {
						oldToken: workingCartToken.substring(0, 10) + '...',
						newToken: responseToken.substring(0, 10) + '...',
					});
					workingCartToken = responseToken;
					await AsyncStorage.setItem(CART_TOKEN_KEY, responseToken);
				}

				console.log('[Cart Sync] Item added successfully', {
					productId: item.productId,
					cartItemCount: addCart.items?.length || 0,
					items: addCart.items?.map((cartItem: WooCommerceCartItem) => ({
						id: cartItem.id,
						productId: cartItem.product_id,
						quantity: cartItem.quantity,
					})),
					responseToken: responseToken?.substring(0, 10) + '...',
					usingToken: workingCartToken.substring(0, 10) + '...',
				});

				// Store the last cart response - this is the most up-to-date cart state
				lastCartResponse = addCart;
			} catch (addError) {
				console.error('[Cart Sync] Failed to add item', {
					productId: item.productId,
					error: addError,
				});
				throw addError;
			}
		}

		// Use the cart from the last add-item response if available
		// This ensures we're using the exact cart state that was returned when items were added
		let finalCart: WooCommerceCart;

		if (
			lastCartResponse &&
			lastCartResponse.items &&
			lastCartResponse.items.length > 0
		) {
			console.log('[Cart Sync] Using cart from last add-item response', {
				itemCount: lastCartResponse.items.length,
			});
			finalCart = lastCartResponse;
		} else {
			// Fallback: fetch cart using the working token
			console.log('[Cart Sync] Fetching final cart state (fallback)', {
				usingToken: workingCartToken.substring(0, 10) + '...',
				tokenLength: workingCartToken.length,
				storageToken:
					(await AsyncStorage.getItem(CART_TOKEN_KEY))?.substring(0, 10) +
					'...',
			});

			const finalResponse = await fetch(`${storeApiUrl}/cart`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Cart-Token': workingCartToken,
				},
			});

			console.log('[Cart Sync] Final cart response status', {
				status: finalResponse.status,
				ok: finalResponse.ok,
			});

			if (!finalResponse.ok) {
				const errorData = await finalResponse.json().catch(() => ({}));
				console.error('[Cart Sync] Failed to fetch final cart', {
					status: finalResponse.status,
					errorData,
				});
				throw new Error(
					`Failed to get final cart: ${finalResponse.status} ${JSON.stringify(
						errorData
					)}`
				);
			}

			finalCart = await finalResponse.json();

			// Update token if it changed
			const finalResponseToken = finalResponse.headers.get('Cart-Token');
			if (finalResponseToken && finalResponseToken !== workingCartToken) {
				console.log('[Cart Sync] Cart token updated in final fetch', {
					oldToken: workingCartToken.substring(0, 10) + '...',
					newToken: finalResponseToken.substring(0, 10) + '...',
				});
				await AsyncStorage.setItem(CART_TOKEN_KEY, finalResponseToken);
			}
		}

		console.log('[Cart Sync] ===== FINAL CART RESPONSE =====');
		console.log(
			'[Cart Sync] Full cart response:',
			JSON.stringify(finalCart, null, 2)
		);
		console.log('[Cart Sync] Cart items:', finalCart.items);
		console.log('[Cart Sync] Items count:', finalCart.items?.length || 0);
		console.log('[Cart Sync] Items type:', typeof finalCart.items);
		console.log('[Cart Sync] Is array?', Array.isArray(finalCart.items));
		console.log('[Cart Sync] Cart keys:', Object.keys(finalCart));

		if (finalCart.items && finalCart.items.length > 0) {
			console.log(
				'[Cart Sync] Items details:',
				finalCart.items.map((item) => ({
					id: item.id,
					productId: item.product_id,
					quantity: item.quantity,
					name: item.name,
				}))
			);
		}

		if (!finalCart.items || finalCart.items.length === 0) {
			console.error('[Cart Sync] ===== ERROR: CART IS EMPTY =====');
			console.error(
				'[Cart Sync] Full cart response:',
				JSON.stringify(finalCart, null, 2)
			);
			console.error('[Cart Sync] Cart token used:', workingCartToken);
			console.error('[Cart Sync] Items property:', finalCart.items);
			console.error('[Cart Sync] Items count property:', finalCart.items_count);
			throw new Error(
				'Cart sync completed but cart is empty. Items may not have been added successfully.'
			);
		}

		console.log('[Cart Sync] ===== SYNC SUCCESSFUL =====');
		return finalCart;
	} catch (error) {
		console.error('[Cart Sync] ===== SYNC ERROR =====');
		console.error('[Cart Sync] Error:', error);
		console.error(
			'[Cart Sync] Error message:',
			error instanceof Error ? error.message : String(error)
		);
		console.error(
			'[Cart Sync] Error stack:',
			error instanceof Error ? error.stack : 'No stack'
		);
		throw error;
	}
}
