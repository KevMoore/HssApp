import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

interface DeepLinkRoute {
	path: string;
	route: string;
	params?: Record<string, string>;
}

interface DeepLinkContextType {
	lastProcessedUrl: string | null;
	isProcessing: boolean;
}

const DeepLinkContext = createContext<DeepLinkContextType | undefined>(undefined);

/**
 * Deep link route mappings
 * Maps custom deep link paths to Expo Router routes
 *
 * Example: hss://product/SOMEGUID -> /product/[id]
 */
const DEEP_LINK_ROUTES: DeepLinkRoute[] = [
	{
		// Map product/{id} to product/{id}
		path: 'product',
		route: 'product',
	},
	{
		// Map order/{orderId} to order detail screen (if exists)
		path: 'order',
		route: 'order',
	},
	// Add more route mappings here as needed
];

/**
 * Parses a deep link URL and returns the route path and params
 *
 * @param url - The deep link URL (e.g., hss://product/SOMEGUID)
 * @returns Object with route path and params, or null if invalid
 */
function parseDeepLink(url: string): { path: string; params: Record<string, string> } | null {
	try {
		const parsed = Linking.parse(url);
		const path = parsed.path || '';

		console.log('[DeepLink] Parsed URL:', { url, parsed, path });

		// Remove leading slash if present
		const cleanPath = path.startsWith('/') ? path.slice(1) : path;

		if (!cleanPath) {
			console.log('[DeepLink] No path found in URL');
			return null;
		}

		// Extract path segments
		const segments = cleanPath.split('/').filter(Boolean);

		if (segments.length === 0) {
			console.log('[DeepLink] No segments found in path');
			return null;
		}

		// Build params from query params and path segments
		const params: Record<string, string> = { ...parsed.queryParams };

		return {
			path: cleanPath,
			params,
		};
	} catch (error) {
		console.error('[DeepLink] Error parsing URL:', error);
		return null;
	}
}

/**
 * Maps a deep link path to an Expo Router route
 *
 * @param path - The deep link path (e.g., "product/SOMEGUID")
 * @returns The Expo Router route path (e.g., "/product/SOMEGUID") or null
 */
function mapDeepLinkToRoute(path: string): { route: string; params: Record<string, string> } | null {
	const segments = path.split('/').filter(Boolean);

	if (segments.length === 0) {
		return null;
	}

	// Find matching route mapping
	const routeMapping = DEEP_LINK_ROUTES.find((mapping) => {
		const mappingSegments = mapping.path.split('/').filter(Boolean);
		return segments[0] === mappingSegments[0];
	});

	if (!routeMapping) {
		console.log('[DeepLink] No route mapping found for path:', path);
		return null;
	}

	// Build the route path
	// Example: product/SOMEGUID -> product/SOMEGUID
	const routeSegments = [routeMapping.route];

	// Add remaining segments (like the productId)
	if (segments.length > 1) {
		routeSegments.push(...segments.slice(1));
	}

	// Extract dynamic params from path segments
	const params: Record<string, string> = {};
	const mappingSegments = routeMapping.path.split('/').filter(Boolean);

	// Map path segments to route params
	// For product/{id}, extract id from segments[1]
	if (segments.length > 1 && mappingSegments.length === 1) {
		// Single-level mapping like "product" -> "product"
		// The second segment is the dynamic param (id)
		params.id = segments[1];
	}

	const route = `/${routeSegments.join('/')}`;

	console.log('[DeepLink] Mapped route:', { path, route, params });

	return { route, params };
}

interface DeepLinkProviderProps {
	children: React.ReactNode;
}

export const DeepLinkProvider: React.FC<DeepLinkProviderProps> = ({ children }) => {
	const router = useRouter();
	const [lastProcessedUrl, setLastProcessedUrl] = useState<string | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const processingRef = useRef(false);

	// Get the initial URL when app opens from a deep link
	useEffect(() => {
		const handleInitialURL = async () => {
			try {
				const initialUrl = await Linking.getInitialURL();
				if (initialUrl) {
					console.log('[DeepLink] Initial URL:', initialUrl);
					await processDeepLink(initialUrl);
				}
			} catch (error) {
				console.error('[DeepLink] Error getting initial URL:', error);
			}
		};

		handleInitialURL();
	}, []);

	// Listen for deep links when app is already open
	useEffect(() => {
		const subscription = Linking.addEventListener('url', (event) => {
			console.log('[DeepLink] URL event received:', event.url);
			processDeepLink(event.url);
		});

		return () => {
			subscription.remove();
		};
	}, []);

	// Listen for push notification responses (when user taps notification)
	useEffect(() => {
		const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
			const data = response.notification.request.content.data;
			if (data?.url) {
				console.log('[DeepLink] Notification URL received:', data.url);
				processDeepLink(data.url);
			}
		});

		return () => {
			subscription.remove();
		};
	}, []);

	const processDeepLink = async (url: string) => {
		// Prevent duplicate processing
		if (processingRef.current || url === lastProcessedUrl) {
			console.log('[DeepLink] Skipping duplicate URL:', url);
			return;
		}

		processingRef.current = true;
		setIsProcessing(true);

		try {
			console.log('[DeepLink] Processing URL:', url);

			// Parse the URL
			const parsed = parseDeepLink(url);
			if (!parsed) {
				console.log('[DeepLink] Could not parse URL');
				return;
			}

			// Map to Expo Router route
			const routeMapping = mapDeepLinkToRoute(parsed.path);
			if (!routeMapping) {
				console.log('[DeepLink] Could not map URL to route');
				return;
			}

			// Merge query params with path params
			const allParams = { ...routeMapping.params, ...parsed.params };

			// The route already includes the dynamic segments (e.g., /product/SOMEGUID)
			const routePath = routeMapping.route;

			console.log('[DeepLink] Navigating to:', { routePath, params: allParams });

			// Navigate to the route
			// Use push to allow back navigation
			router.push(routePath as any);

			setLastProcessedUrl(url);
		} catch (error) {
			console.error('[DeepLink] Error processing deep link:', error);
		} finally {
			processingRef.current = false;
			setIsProcessing(false);
		}
	};

	return (
		<DeepLinkContext.Provider value={{ lastProcessedUrl, isProcessing }}>
			{children}
		</DeepLinkContext.Provider>
	);
};

/**
 * Hook to access deep link context
 */
export const useDeepLink = (): DeepLinkContextType => {
	const context = useContext(DeepLinkContext);
	if (context === undefined) {
		throw new Error('useDeepLink must be used within a DeepLinkProvider');
	}
	return context;
};

