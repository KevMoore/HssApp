/**
 * Category Image Cache Service
 * Downloads and caches category images locally for offline use
 */

import { Directory, File, Paths } from 'expo-file-system';
import { listCategories, WooCommerceCategory } from './woocommerceService';

const CACHE_DIR = new Directory(Paths.cache, 'category-images');
const CACHE_MANIFEST_FILE = new File(CACHE_DIR, 'manifest.json');

interface CategoryImageManifest {
	[categoryId: number]: {
		imageUrl: string;
		localPath: string;
		cachedAt: number;
	};
}

let manifest: CategoryImageManifest | null = null;
let isInitializing = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Initialize the cache directory
 */
async function ensureCacheDirectory(): Promise<void> {
	if (!CACHE_DIR.exists) {
		CACHE_DIR.create({ intermediates: true });
		console.log('[CategoryImageCache] Created cache directory:', CACHE_DIR.uri);
	}
}

/**
 * Load manifest from disk
 */
async function loadManifest(): Promise<CategoryImageManifest> {
	try {
		if (CACHE_MANIFEST_FILE.exists) {
			const manifestContent = await CACHE_MANIFEST_FILE.text();
			return JSON.parse(manifestContent);
		}
	} catch (error) {
		console.error('[CategoryImageCache] Error loading manifest:', error);
	}
	return {};
}

/**
 * Save manifest to disk
 */
async function saveManifest(manifestData: CategoryImageManifest): Promise<void> {
	try {
		CACHE_MANIFEST_FILE.write(JSON.stringify(manifestData, null, 2));
		manifest = manifestData;
	} catch (error) {
		console.error('[CategoryImageCache] Error saving manifest:', error);
	}
}

/**
 * Download and cache a single category image
 */
async function cacheCategoryImage(
	category: WooCommerceCategory
): Promise<string | null> {
	if (!category.image?.src) {
		return null;
	}

	const imageUrl = category.image.src;
	const categoryId = category.id;
	const fileExtension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
	const localFile = new File(CACHE_DIR, `category-${categoryId}.${fileExtension}`);

	try {
		// Check if already cached
		if (localFile.exists) {
			console.log(`[CategoryImageCache] Image already cached for category ${categoryId}`);
			return localFile.uri;
		}

		// Download image
		console.log(`[CategoryImageCache] Downloading image for category ${categoryId}:`, imageUrl);
		const downloadedFile = await File.downloadFileAsync(imageUrl, localFile, { idempotent: true });

		if (downloadedFile.exists) {
			console.log(`[CategoryImageCache] Successfully cached image for category ${categoryId}`);
			return downloadedFile.uri;
		} else {
			console.warn(
				`[CategoryImageCache] Failed to download image for category ${categoryId}`
			);
			return null;
		}
	} catch (error) {
		console.error(
			`[CategoryImageCache] Error caching image for category ${categoryId}:`,
			error
		);
		return null;
	}
}

/**
 * Initialize category image cache - downloads all category images
 */
export async function initializeCategoryImageCache(): Promise<void> {
	// Prevent multiple simultaneous initializations
	if (isInitializing) {
		if (initializationPromise) {
			return initializationPromise;
		}
	}

	isInitializing = true;
	initializationPromise = (async () => {
		try {
			console.log('[CategoryImageCache] Initializing category image cache...');
			await ensureCacheDirectory();

			// Load existing manifest
			manifest = await loadManifest();
			console.log('[CategoryImageCache] Loaded manifest with', Object.keys(manifest).length, 'entries');

			// Fetch all categories from WooCommerce
			console.log('[CategoryImageCache] Fetching categories from WooCommerce...');
			const categories = await listCategories({
				per_page: 100,
			});

			console.log(`[CategoryImageCache] Found ${categories.length} categories`);

			// Filter categories with images
			const categoriesWithImages = categories.filter((cat) => cat.image?.src);
			console.log(`[CategoryImageCache] ${categoriesWithImages.length} categories have images`);

			// Download and cache images
			let cachedCount = 0;
			let skippedCount = 0;

			for (const category of categoriesWithImages) {
				const localPath = await cacheCategoryImage(category);
				if (localPath) {
					manifest![category.id] = {
						imageUrl: category.image!.src,
						localPath,
						cachedAt: Date.now(),
					};
					cachedCount++;
				} else {
					skippedCount++;
				}
			}

			// Save updated manifest
			await saveManifest(manifest!);

			console.log(
				`[CategoryImageCache] Cache initialization complete: ${cachedCount} cached, ${skippedCount} skipped`
			);
		} catch (error) {
			console.error('[CategoryImageCache] Error initializing cache:', error);
		} finally {
			isInitializing = false;
			initializationPromise = null;
		}
	})();

	return initializationPromise;
}

/**
 * Get cached image path for a category ID
 * Returns local file path if cached, or null if not available
 */
export async function getCachedCategoryImage(categoryId: number): Promise<string | null> {
	// Ensure manifest is loaded
	if (!manifest) {
		manifest = await loadManifest();
	}

	const entry = manifest[categoryId];
	if (!entry) {
		return null;
	}

	// Verify file still exists
	try {
		const file = new File(entry.localPath);
		if (file.exists) {
			return entry.localPath;
		} else {
			// File was deleted, remove from manifest
			delete manifest[categoryId];
			await saveManifest(manifest);
			return null;
		}
	} catch (error) {
		console.error(`[CategoryImageCache] Error checking cached image for category ${categoryId}:`, error);
		return null;
	}
}

/**
 * Get cached image path for a category ID (synchronous check - uses loaded manifest)
 * Returns local file path if cached, or null if not available
 * Note: This doesn't verify file existence, use getCachedCategoryImage for that
 */
export function getCachedCategoryImageSync(categoryId: number): string | null {
	if (!manifest) {
		return null;
	}

	const entry = manifest[categoryId];
	return entry?.localPath || null;
}

/**
 * Clear all cached category images
 */
export async function clearCategoryImageCache(): Promise<void> {
	try {
		if (CACHE_DIR.exists) {
			CACHE_DIR.delete({ idempotent: true });
			console.log('[CategoryImageCache] Cleared cache directory');
		}
		manifest = {};
		await saveManifest({});
	} catch (error) {
		console.error('[CategoryImageCache] Error clearing cache:', error);
	}
}

