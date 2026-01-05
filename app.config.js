/**
 * Expo App Configuration
 * This file reads EAS secrets and makes them available via Constants.expoConfig.extra
 * 
 * For production builds, set these as EAS secrets:
 * - WOOCOMMERCE_CONSUMER_KEY
 * - WOOCOMMERCE_CONSUMER_SECRET
 * 
 * For local development, set them in .env file (without EXPO_PUBLIC_ prefix):
 * - WOOCOMMERCE_CONSUMER_KEY=your_key
 * - WOOCOMMERCE_CONSUMER_SECRET=your_secret
 */

// Load .env file for local development
// This allows non-EXPO_PUBLIC_ variables to be read from .env during local development
try {
	// Use require to load dotenv if available, otherwise fall back to manual parsing
	const fs = require('fs');
	const path = require('path');
	const envPath = path.resolve(process.cwd(), '.env');
	
	if (fs.existsSync(envPath)) {
		const envContent = fs.readFileSync(envPath, 'utf8');
		envContent.split('\n').forEach((line) => {
			const trimmedLine = line.trim();
			// Skip comments and empty lines
			if (trimmedLine && !trimmedLine.startsWith('#')) {
				const equalIndex = trimmedLine.indexOf('=');
				if (equalIndex !== -1) {
					const key = trimmedLine.substring(0, equalIndex).trim();
					const value = trimmedLine.substring(equalIndex + 1).trim();
					// Remove quotes if present
					const unquotedValue = value.replace(/^["']|["']$/g, '');
					// Only set if not already in process.env (EAS secrets take precedence)
					if (!process.env[key]) {
						process.env[key] = unquotedValue;
					}
				}
			}
		});
	}
} catch (error) {
	// Silently fail if .env file doesn't exist or can't be read
	// This is expected in production builds where EAS secrets are used
}

module.exports = ({ config }) => {
	return {
		...config,
		extra: {
			...config.extra,
			// WooCommerce API credentials
			// For EAS builds: read from EAS secrets via process.env
			// For local development: read from .env file (loaded above)
			woocommerceBaseUrl:
				process.env.EXPO_PUBLIC_WOOCOMMERCE_BASE_URL ||
				process.env.WOOCOMMERCE_BASE_URL ||
				config.extra?.woocommerceBaseUrl,
			woocommerceConsumerKey:
				process.env.WOOCOMMERCE_CONSUMER_KEY ||
				config.extra?.woocommerceConsumerKey,
			woocommerceConsumerSecret:
				process.env.WOOCOMMERCE_CONSUMER_SECRET ||
				config.extra?.woocommerceConsumerSecret,
		},
	};
};

