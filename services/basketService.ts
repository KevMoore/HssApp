import * as SQLite from 'expo-sqlite';
import { Part } from '../types';

const DB_NAME = 'hss_basket.db';
const TABLE_NAME = 'basket_items';

export interface BasketItem {
	id: string; // Part ID
	partNumber: string;
	name: string;
	price?: number;
	quantity: number;
	imageUrl?: string;
	manufacturer: string;
	addedAt: number; // Timestamp
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
				addedAt INTEGER NOT NULL
			);
		`);

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
 */
export async function addToBasket(part: Part, quantity: number = 1): Promise<void> {
	try {
		const database = await initDatabase();
		const now = Date.now();

		// Check if item already exists
		const existing = await database.getFirstAsync<BasketItem>(
			`SELECT * FROM ${TABLE_NAME} WHERE id = ?`,
			[part.id]
		);

		if (existing) {
			// Update quantity
			await database.runAsync(
				`UPDATE ${TABLE_NAME} SET quantity = quantity + ?, addedAt = ? WHERE id = ?`,
				[quantity, now, part.id]
			);
		} else {
			// Insert new item
			await database.runAsync(
				`INSERT INTO ${TABLE_NAME} (id, partNumber, name, price, quantity, imageUrl, manufacturer, addedAt)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					part.id,
					part.partNumber,
					part.name,
					part.price ?? null,
					quantity,
					part.imageUrl ?? null,
					part.manufacturer,
					now,
				]
			);
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
 */
export async function updateBasketItemQuantity(
	partId: string,
	quantity: number
): Promise<void> {
	try {
		const database = await initDatabase();
		if (quantity <= 0) {
			// Remove item if quantity is 0 or less
			await database.runAsync(`DELETE FROM ${TABLE_NAME} WHERE id = ?`, [partId]);
		} else {
			await database.runAsync(
				`UPDATE ${TABLE_NAME} SET quantity = ? WHERE id = ?`,
				[quantity, partId]
			);
		}
	} catch (error) {
		console.error('Error updating basket item quantity:', error);
		throw error;
	}
}

/**
 * Remove item from basket
 */
export async function removeFromBasket(partId: string): Promise<void> {
	try {
		const database = await initDatabase();
		await database.runAsync(`DELETE FROM ${TABLE_NAME} WHERE id = ?`, [partId]);
	} catch (error) {
		console.error('Error removing from basket:', error);
		throw error;
	}
}

/**
 * Clear all items from basket
 */
export async function clearBasket(): Promise<void> {
	try {
		const database = await initDatabase();
		await database.runAsync(`DELETE FROM ${TABLE_NAME}`);
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

