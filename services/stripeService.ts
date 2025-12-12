/**
 * Stripe Payment Service
 * Handles Stripe PaymentSheet integration for processing payments
 */

import Constants from 'expo-constants';

// Stripe Configuration
const getStripeConfig = () => {
	const publishableKey =
		process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
		Constants.expoConfig?.extra?.stripePublishableKey;

	if (!publishableKey) {
		throw new Error(
			'Stripe publishable key not configured. Please set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY in your .env file.'
		);
	}

	return {
		publishableKey,
	};
};

/**
 * Create a PaymentIntent via WooCommerce backend
 * This calls your WordPress/WooCommerce endpoint that creates a PaymentIntent
 * using your existing WooCommerce Stripe integration
 */
export async function createPaymentIntent(
	amount: number,
	orderId: number,
	currency: string = 'gbp'
): Promise<string> {
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

	// Call your custom WordPress REST API endpoint
	// This endpoint should create a PaymentIntent using your WooCommerce Stripe plugin
	const endpoint = `${normalizedUrl}/wp-json/hss/v1/create-payment-intent`;

	try {
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				amount, // Amount in pence (smallest currency unit)
				currency,
				order_id: orderId, // WooCommerce order ID for tracking
			}),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				`Failed to create PaymentIntent: ${response.status} ${
					response.statusText
				}. ${JSON.stringify(errorData)}`
			);
		}

		const data = await response.json();
		
		if (!data.client_secret) {
			throw new Error('PaymentIntent response missing client_secret');
		}

		console.log('[Stripe] PaymentIntent created successfully:', {
			orderId,
			amount,
			currency,
		});

		return data.client_secret;
	} catch (error) {
		console.error('[Stripe] Error creating PaymentIntent:', error);
		throw error;
	}
}

/**
 * Retrieve PaymentIntent billing details from WooCommerce backend
 * This calls your WordPress/WooCommerce endpoint to get billing details
 * after payment succeeds
 */
export async function getPaymentIntentBillingDetails(
	clientSecret: string
): Promise<{
	name?: string;
	email?: string;
	phone?: string;
	address?: {
		line1?: string;
		line2?: string;
		city?: string;
		state?: string;
		postal_code?: string;
		country?: string;
	};
} | null> {
	const baseUrl =
		process.env.EXPO_PUBLIC_WOOCOMMERCE_BASE_URL ||
		Constants.expoConfig?.extra?.woocommerceBaseUrl;

	if (!baseUrl) {
		console.warn(
			'[Stripe] WooCommerce base URL not configured. Cannot retrieve billing details.'
		);
		return null;
	}

	// Normalize base URL (remove trailing slash)
	const normalizedUrl = baseUrl.replace(/\/$/, '');

	// Call your custom WordPress REST API endpoint
	const endpoint = `${normalizedUrl}/wp-json/hss/v1/payment-intent-billing`;

	try {
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				client_secret: clientSecret,
			}),
		});

		if (!response.ok) {
			console.warn(
				'[Stripe] Failed to retrieve billing details:',
				response.status,
				response.statusText
			);
			return null;
		}

		const data = await response.json();
		return data.billing_details || null;
	} catch (error) {
		console.warn('[Stripe] Error retrieving billing details:', error);
		return null;
	}
}

/**
 * Stripe service functions
 * Note: These functions need to be called from within a component that has access to useStripe hook
 * For now, we'll export helper functions that can be used with the hook
 */

/**
 * Initialize PaymentSheet with billing address collection
 * @param initPaymentSheet Function from useStripe hook
 * @param clientSecret PaymentIntent client secret from backend
 * @param returnURL Optional return URL for iOS redirects (required for some payment methods)
 * @returns Error if initialization fails
 */
export async function initializePaymentSheetHelper(
	initPaymentSheet: any,
	clientSecret: string,
	returnURL?: string
): Promise<{ error?: any }> {
	try {
		// Initialize PaymentSheet with billing address collection
		const initParams: any = {
			merchantDisplayName: 'HSS Spares',
			paymentIntentClientSecret: clientSecret,
			billingDetailsCollectionConfiguration: {
				name: 'ALWAYS',
				email: 'ALWAYS',
				phone: 'OPTIONAL',
				address: 'FULL', // Collect full address including postcode
			},
			defaultBillingDetails: {
				address: {
					country: 'GB', // Default to UK
				},
			},
			// Allow delayed payment methods (e.g., SEPA Debit, US bank accounts)
			// Set to true if your business can handle payments that complete after a delay
			allowsDelayedPaymentMethods: true,
		};

		// Add returnURL for iOS if provided (required for payment methods that redirect)
		if (returnURL) {
			initParams.returnURL = returnURL;
		}

		const { error } = await initPaymentSheet(initParams);

		if (error) {
			console.error('[Stripe] Error initializing PaymentSheet:', error);
			return { error };
		}

		console.log('[Stripe] PaymentSheet initialized successfully');
		return {};
	} catch (error) {
		console.error('[Stripe] Exception initializing PaymentSheet:', error);
		return { error };
	}
}

/**
 * Present PaymentSheet to user
 * @param presentPaymentSheet Function from useStripe hook
 * @returns Payment result with error if payment failed
 */
export async function presentPaymentSheetHelper(
	presentPaymentSheet: any
): Promise<{ error?: any }> {
	try {
		const { error } = await presentPaymentSheet();

		if (error) {
			console.error('[Stripe] Error presenting PaymentSheet:', error);
			return { error };
		}

		// Payment succeeded
		console.log('[Stripe] Payment successful');
		return {};
	} catch (error) {
		console.error('[Stripe] Exception presenting PaymentSheet:', error);
		return { error };
	}
}
