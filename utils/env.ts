import Constants from 'expo-constants';

/**
 * Get the next day delivery charge from environment variables or app config
 * @returns The delivery charge in GBP, defaults to 0 if not set
 */
export const getNextDayDeliveryCharge = (): number => {
	// Try environment variable first, then fall back to app.json extra config
	const charge =
		(process.env.EXPO_PUBLIC_NEXT_DAY_DELIVERY_CHARGE
			? parseFloat(process.env.EXPO_PUBLIC_NEXT_DAY_DELIVERY_CHARGE)
			: undefined) ?? Constants.expoConfig?.extra?.nextDayDeliveryCharge;

	if (charge === undefined || isNaN(charge)) {
		return 0;
	}

	return charge;
};

/**
 * Get the VAT rate from environment variables or app config
 * @returns The VAT rate as a percentage (e.g., 20 for 20%), defaults to 0 if not set
 */
export const getVatRate = (): number => {
	// Try environment variable first, then fall back to app.json extra config
	const rate =
		(process.env.EXPO_PUBLIC_VAT_RATE
			? parseFloat(process.env.EXPO_PUBLIC_VAT_RATE)
			: undefined) ?? Constants.expoConfig?.extra?.vatRate;

	if (rate === undefined || isNaN(rate)) {
		return 0;
	}

	return rate;
};

/**
 * Calculate VAT amount for a given subtotal
 * @param subtotal The subtotal amount before VAT
 * @returns The VAT amount
 */
export const calculateVat = (subtotal: number): number => {
	const vatRate = getVatRate();
	return (subtotal * vatRate) / 100;
};
