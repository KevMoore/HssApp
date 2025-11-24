import * as SQLite from 'expo-sqlite';

const DB_NAME = 'hss_search_history.db';
const TABLE_NAME = 'search_history';
const MAX_HISTORY_ITEMS = 20;

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize the database and create the search_history table if it doesn't exist
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
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				search_term TEXT NOT NULL,
				search_mode TEXT NOT NULL,
				created_at INTEGER NOT NULL,
				UNIQUE(search_term, search_mode)
			);
		`);

		// Create index for faster queries
		await db.execAsync(`
			CREATE INDEX IF NOT EXISTS idx_created_at ON ${TABLE_NAME}(created_at DESC);
		`);

		return db;
	} catch (error) {
		console.error('Error initializing search history database:', error);
		throw error;
	}
}

/**
 * Save a search term to history
 */
export async function saveSearchTerm(
	searchTerm: string,
	searchMode: 'appliance' | 'part' | 'keyword' = 'keyword'
): Promise<void> {
	try {
		const database = await initDatabase();
		const trimmedTerm = searchTerm.trim();

		if (!trimmedTerm) {
			return;
		}

		const now = Date.now();

		// Insert or replace (update timestamp if exists)
		await database.runAsync(
			`INSERT OR REPLACE INTO ${TABLE_NAME} (search_term, search_mode, created_at)
			 VALUES (?, ?, ?)`,
			[trimmedTerm.toLowerCase(), searchMode, now]
		);

		// Keep only the last MAX_HISTORY_ITEMS entries
		await database.runAsync(
			`DELETE FROM ${TABLE_NAME}
			 WHERE id NOT IN (
				 SELECT id FROM ${TABLE_NAME}
				 ORDER BY created_at DESC
				 LIMIT ?
			 )`,
			[MAX_HISTORY_ITEMS]
		);
	} catch (error) {
		console.error('Error saving search term:', error);
		// Don't throw - search history is not critical
	}
}

/**
 * Get recent search terms, optionally filtered by a query string
 */
export async function getRecentSearchTerms(
	query?: string,
	limit: number = 10
): Promise<
	Array<{ search_term: string; search_mode: string; created_at: number }>
> {
	try {
		const database = await initDatabase();
		let sql = `SELECT search_term, search_mode, created_at 
				   FROM ${TABLE_NAME}`;
		const params: any[] = [];

		if (query && query.trim()) {
			const trimmedQuery = query.trim().toLowerCase();
			sql += ` WHERE search_term LIKE ?`;
			params.push(`%${trimmedQuery}%`);
		}

		sql += ` ORDER BY created_at DESC LIMIT ?`;
		params.push(limit);

		const result = await database.getAllAsync<{
			search_term: string;
			search_mode: string;
			created_at: number;
		}>(sql, params);

		return result;
	} catch (error) {
		console.error('Error getting recent search terms:', error);
		return [];
	}
}

/**
 * Clear all search history
 */
export async function clearSearchHistory(): Promise<void> {
	try {
		const database = await initDatabase();
		await database.runAsync(`DELETE FROM ${TABLE_NAME}`);
	} catch (error) {
		console.error('Error clearing search history:', error);
		throw error;
	}
}

/**
 * Get search suggestions based on current input
 * Returns terms that start with or contain the query, ordered by recency
 */
export async function getSearchSuggestions(
	query: string,
	maxResults: number = 5
): Promise<string[]> {
	try {
		if (!query || !query.trim()) {
			return [];
		}

		const database = await initDatabase();
		const trimmedQuery = query.trim().toLowerCase();

		// First, get exact matches (starts with)
		const startsWithResults = await database.getAllAsync<{
			search_term: string;
		}>(
			`SELECT DISTINCT search_term 
			 FROM ${TABLE_NAME}
			 WHERE search_term LIKE ?
			 ORDER BY created_at DESC
			 LIMIT ?`,
			[`${trimmedQuery}%`, maxResults]
		);

		// If we have enough results, return them
		if (startsWithResults.length >= maxResults) {
			return startsWithResults.map((r) => r.search_term);
		}

		// Otherwise, get contains matches
		const containsResults = await database.getAllAsync<{
			search_term: string;
		}>(
			`SELECT DISTINCT search_term 
			 FROM ${TABLE_NAME}
			 WHERE search_term LIKE ? AND search_term NOT LIKE ?
			 ORDER BY created_at DESC
			 LIMIT ?`,
			[
				`%${trimmedQuery}%`,
				`${trimmedQuery}%`,
				maxResults - startsWithResults.length,
			]
		);

		// Combine results, removing duplicates
		const allTerms = new Set<string>();
		startsWithResults.forEach((r) => allTerms.add(r.search_term));
		containsResults.forEach((r) => allTerms.add(r.search_term));

		return Array.from(allTerms).slice(0, maxResults);
	} catch (error) {
		console.error('Error getting search suggestions:', error);
		return [];
	}
}
