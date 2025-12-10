import * as SQLite from 'expo-sqlite';
import { Part } from '../types';
import {
	addItemToCart,
	updateCartItem,
	removeCartItem,
	clearCart,
	getCart,
	syncLocalBasketToWooCommerce,
	checkAndClearEmptyCart,
	WooCommerceCartItem,
} from './woocommerceCartService';

const DB_NAME = 'hss_basket.db';
const TABLE_NAME = 'basket_items';

export interface BasketItem {
	id: string; // Part ID (WooCommerce product ID)
	partNumber: string;
	name: string;
	price?: number;
	quantity: number;
	imageUrl?: string;
	manufacturer: string;
	addedAt: number; // Timestamp
	cartItemKey?: string; // WooCommerce cart item key for syncing
}

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize the database and create the basket_items table if it doesn't exist
 */
async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
	if (db) {
		return db;
	}

	try {
		db = await SQLite.openDatabaseAsync(DB_NAME);

		// Create table if it doesn't exist
		await db.execAsync(`
			CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
				id TEXT PRIMARY KEY,
				partNumber TEXT NOT NULL,
				name TEXT NOT NULL,
				price REAL,
				quantity INTEGER NOT NULL DEFAULT 1,
				imageUrl TEXT,
				manufacturer TEXT NOT NULL,
				addedAt INTEGER NOT NULL,
				cartItemKey TEXT
			);
		`);

		// Add cartItemKey column if it doesn't exist (for existing databases)
		try {
			await db.execAsync(`
				ALTER TABLE ${TABLE_NAME} ADD COLUMN cartItemKey TEXT;
			`);
		} catch (error) {
			// Column already exists, ignore error
		}

		// Create index for faster queries
		await db.execAsync(`
			CREATE INDEX IF NOT EXISTS idx_added_at ON ${TABLE_NAME}(addedAt DESC);
		`);

		return db;
	} catch (error) {
		console.error('Error initializing basket database:', error);
		throw error;
	}
}

/**
 * Add or update an item in the basket
 * Syncs with WooCommerce cart when online
 */
export async function addToBasket(
	part: Part,
	quantity: number = 1
): Promise<void> {
	try {
		const database = await initDatabase();
		const now = Date.now();

		// Check if item already exists
		const existing = await database.getFirstAsync<BasketItem>(
			`SELECT * FROM ${TABLE_NAME} WHERE id = ?`,
			[part.id]
		);

		const productId = parseInt(part.id, 10);
		if (isNaN(productId)) {
			throw new Error(`Invalid product ID: ${part.id}`);
		}

		if (existing) {
			// Update quantity locally
			const newQuantity = existing.quantity + quantity;
			await database.runAsync(
				`UPDATE ${TABLE_NAME} SET quantity = ?, addedAt = ? WHERE id = ?`,
				[newQuantity, now, part.id]
			);

			// Sync with WooCommerce if cart item key exists
			if (existing.cartItemKey) {
				try {
					await updateCartItem(existing.cartItemKey, newQuantity);
				} catch (wcError) {
					console.warn(
						'Failed to sync with WooCommerce cart, keeping local state:',
						wcError
					);
				}
			} else {
				// Try to add to WooCommerce cart
				try {
					const cart = await addItemToCart(productId, quantity);
					// Find the cart item key for this product
					const cartItem = cart.items.find(
						(item) => item.product_id === productId
					);
					if (cartItem) {
						await database.runAsync(
							`UPDATE ${TABLE_NAME} SET cartItemKey = ? WHERE id = ?`,
							[cartItem.id, part.id]
						);
					}
				} catch (wcError) {
					console.warn(
						'Failed to sync with WooCommerce cart, keeping local state:',
						wcError
					);
				}
			}
		} else {
			// Insert new item locally
			await database.runAsync(
				`INSERT INTO ${TABLE_NAME} (id, partNumber, name, price, quantity, imageUrl, manufacturer, addedAt, cartItemKey)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					part.id,
					part.partNumber,
					part.name,
					part.price ?? null,
					quantity,
					part.imageUrl ?? null,
					part.manufacturer,
					now,
					null, // cartItemKey will be set after WooCommerce sync
				]
			);

			// Sync with WooCommerce
			try {
				const cart = await addItemToCart(productId, quantity);
				// Find the cart item key for this product
				const cartItem = cart.items.find(
					(item) => item.product_id === productId
				);
				if (cartItem) {
					await database.runAsync(
						`UPDATE ${TABLE_NAME} SET cartItemKey = ? WHERE id = ?`,
						[cartItem.id, part.id]
					);
				}
			} catch (wcError) {
				console.warn(
					'Failed to sync with WooCommerce cart, keeping local state:',
					wcError
				);
			}
		}
	} catch (error) {
		console.error('Error adding to basket:', error);
		throw error;
	}
}

/**
 * Get all items in the basket
 */
export async function getBasketItems(): Promise<BasketItem[]> {
	try {
		const database = await initDatabase();
		const items = await database.getAllAsync<BasketItem>(
			`SELECT * FROM ${TABLE_NAME} ORDER BY addedAt DESC`
		);
		return items;
	} catch (error) {
		console.error('Error getting basket items:', error);
		return [];
	}
}

/**
 * Update item quantity in basket
 * Syncs with WooCommerce cart when online
 */
export async function updateBasketItemQuantity(
	partId: string,
	quantity: number
): Promise<void> {
	try {
		const database = await initDatabase();
		if (quantity <= 0) {
			// Remove item if quantity is 0 or less
			const item = await database.getFirstAsync<BasketItem>(
				`SELECT * FROM ${TABLE_NAME} WHERE id = ?`,
				[partId]
			);
			await database.runAsync(`DELETE FROM ${TABLE_NAME} WHERE id = ?`, [
				partId,
			]);

			// Sync removal with WooCommerce
			if (item?.cartItemKey) {
				try {
					await removeCartItem(item.cartItemKey);
					// Check if cart is now empty and clear token if needed
					await checkAndClearEmptyCart();
				} catch (wcError) {
					console.warn(
						'Failed to sync removal with WooCommerce cart:',
						wcError
					);
				}
			} else {
				// Fallback: Try to find item in WooCommerce cart by productId
				// This handles cases where cartItemKey was lost but item exists in cart
				try {
					const productId = parseInt(partId, 10);
					if (!isNaN(productId)) {
						const cart = await getCart();
						const cartItem = cart.items?.find(
							(ci) => ci.product_id === productId
						);
						if (cartItem) {
							// Found it! Remove using the cart item key
							await removeCartItem(cartItem.id);
							// Check if cart is now empty and clear token if needed
							await checkAndClearEmptyCart();
						}
					}
				} catch (wcError) {
					console.warn(
						'Failed to sync removal with WooCommerce cart (fallback):',
						wcError
					);
				}
			}
		} else {
			await database.runAsync(
				`UPDATE ${TABLE_NAME} SET quantity = ? WHERE id = ?`,
				[quantity, partId]
			);

			// Sync with WooCommerce
			const item = await database.getFirstAsync<BasketItem>(
				`SELECT * FROM ${TABLE_NAME} WHERE id = ?`,
				[partId]
			);
			if (item?.cartItemKey) {
				try {
					await updateCartItem(item.cartItemKey, quantity);
				} catch (wcError) {
					console.warn('Failed to sync with WooCommerce cart:', wcError);
				}
			} else {
				// Fallback: Try to find item in WooCommerce cart by productId
				// This handles cases where cartItemKey was lost but item exists in cart
				try {
					const productId = parseInt(partId, 10);
					if (!isNaN(productId)) {
						const cart = await getCart();
						const cartItem = cart.items?.find(
							(ci) => ci.product_id === productId
						);
						if (cartItem) {
							// Found it! Update using the cart item key and save it
							await updateCartItem(cartItem.id, quantity);
							await database.runAsync(
								`UPDATE ${TABLE_NAME} SET cartItemKey = ? WHERE id = ?`,
								[cartItem.id, partId]
							);
						}
					}
				} catch (wcError) {
					console.warn(
						'Failed to sync with WooCommerce cart (fallback):',
						wcError
					);
				}
			}
		}
	} catch (error) {
		console.error('Error updating basket item quantity:', error);
		throw error;
	}
}

/**
 * Remove item from basket
 * Syncs with WooCommerce cart when online
 */
export async function removeFromBasket(partId: string): Promise<void> {
	try {
		const database = await initDatabase();

		// Get item before deletion to get cart item key
		const item = await database.getFirstAsync<BasketItem>(
			`SELECT * FROM ${TABLE_NAME} WHERE id = ?`,
			[partId]
		);

		await database.runAsync(`DELETE FROM ${TABLE_NAME} WHERE id = ?`, [partId]);

		// Sync removal with WooCommerce
		if (item?.cartItemKey) {
			try {
				await removeCartItem(item.cartItemKey);
				// Check if cart is now empty and clear token if needed
				await checkAndClearEmptyCart();
			} catch (wcError) {
				console.warn('Failed to sync removal with WooCommerce cart:', wcError);
			}
		} else {
			// Fallback: Try to find item in WooCommerce cart by productId
			// This handles cases where cartItemKey was lost but item exists in cart
			try {
				const productId = parseInt(partId, 10);
				if (!isNaN(productId)) {
					const cart = await getCart();
					const cartItem = cart.items?.find(
						(ci) => ci.product_id === productId
					);
					if (cartItem) {
						// Found it! Remove using the cart item key
						await removeCartItem(cartItem.id);
						// Check if cart is now empty and clear token if needed
						await checkAndClearEmptyCart();
					}
				}
			} catch (wcError) {
				console.warn(
					'Failed to sync removal with WooCommerce cart (fallback):',
					wcError
				);
			}
		}
	} catch (error) {
		console.error('Error removing from basket:', error);
		throw error;
	}
}

/**
 * Clear all items from basket
 * Syncs with WooCommerce cart when online
 */
export async function clearBasket(): Promise<void> {
	try {
		const database = await initDatabase();
		await database.runAsync(`DELETE FROM ${TABLE_NAME}`);

		// Sync clearing with WooCommerce
		try {
			await clearCart();
		} catch (wcError) {
			console.warn('Failed to sync clearing with WooCommerce cart:', wcError);
		}
	} catch (error) {
		console.error('Error clearing basket:', error);
		throw error;
	}
}

/**
 * Get total number of items in basket (sum of quantities)
 */
export async function getBasketItemCount(): Promise<number> {
	try {
		const database = await initDatabase();
		const result = await database.getFirstAsync<{ total: number }>(
			`SELECT COALESCE(SUM(quantity), 0) as total FROM ${TABLE_NAME}`
		);
		return result?.total ?? 0;
	} catch (error) {
		console.error('Error getting basket item count:', error);
		return 0;
	}
}

/**
 * Get total price of all items in basket
 */
export async function getBasketTotal(): Promise<number> {
	try {
		const database = await initDatabase();
		const result = await database.getFirstAsync<{ total: number }>(
			`SELECT COALESCE(SUM(price * quantity), 0) as total FROM ${TABLE_NAME} WHERE price IS NOT NULL`
		);
		return result?.total ?? 0;
	} catch (error) {
		console.error('Error getting basket total:', error);
		return 0;
	}
}
