/**
 * Stripe Payment Service
 * Handles Stripe PaymentSheet integration for processing payments
 */

import Constants from 'expo-constants';
import { useStripe, PaymentSheet } from '@stripe/stripe-react-native';

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
 * Create a PaymentIntent on your backend
 * This should call your server endpoint that creates a PaymentIntent
 * For now, we'll return a mock client secret for development
 */
async function createPaymentIntent(
	amount: number,
	currency: string = 'gbp'
): Promise<string> {
	// TODO: Replace with actual backend API call
	// const response = await fetch('https://your-backend.com/create-payment-intent', {
	//   method: 'POST',
	//   headers: { 'Content-Type': 'application/json' },
	//   body: JSON.stringify({ amount, currency }),
	// });
	// const { clientSecret } = await response.json();
	// return clientSecret;

	// For development/prototyping, return a mock client secret
	// In production, this MUST call your backend
	console.warn(
		'[Stripe] Using mock PaymentIntent - replace with backend API call'
	);
	return 'pi_mock_client_secret_for_development';
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
 * @returns Error if initialization fails
 */
export async function initializePaymentSheetHelper(
	initPaymentSheet: any,
	clientSecret: string
): Promise<{ error?: any }> {
	try {
		// Initialize PaymentSheet with billing address collection
		const { error } = await initPaymentSheet({
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
		});

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
