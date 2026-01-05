/**
 * WooCommerce Orders API Service
 * Handles order creation, updates, and retrieval using WooCommerce REST API v3
 */

import Constants from 'expo-constants';
import { BasketItem } from './basketService';
import {
	getNextDayDeliveryCharge,
	getVatRate,
	calculateVat,
} from '../utils/env';
import {
	getOrCreateCustomerId,
	getCustomerId,
} from './woocommerceCustomerService';

// WooCommerce API Configuration
const getWooCommerceConfig = () => {
	const baseUrl =
		process.env.EXPO_PUBLIC_WOOCOMMERCE_BASE_URL ||
		Constants.expoConfig?.extra?.woocommerceBaseUrl;
	const consumerKey =
		process.env.EXPO_PUBLIC_WOOCOMMERCE_CONSUMER_KEY ||
		Constants.expoConfig?.extra?.woocommerceConsumerKey;
	const consumerSecret =
		process.env.EXPO_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET ||
		Constants.expoConfig?.extra?.woocommerceConsumerSecret;

	if (!baseUrl || !consumerKey || !consumerSecret) {
		throw new Error(
			'WooCommerce API credentials not configured. Please set EXPO_PUBLIC_WOOCOMMERCE_BASE_URL, EXPO_PUBLIC_WOOCOMMERCE_CONSUMER_KEY, and EXPO_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET in your .env file.'
		);
	}

	// Normalize base URL (remove trailing slash)
	const normalizedUrl = baseUrl.replace(/\/$/, '');

	return {
		baseUrl: normalizedUrl,
		consumerKey,
		consumerSecret,
	};
};

/**
 * Base64 encode helper for React Native
 */
const base64Encode = (str: string): string => {
	try {
		// Try native btoa if available (web environment)
		if (typeof global.btoa === 'function') {
			return global.btoa(str);
		}
		// Use Buffer if available (Node.js/Expo environment)
		if (typeof Buffer !== 'undefined') {
			return Buffer.from(str, 'utf8').toString('base64');
		}
		// Manual base64 encoding implementation
		const chars =
			'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
		let output = '';
		let i = 0;

		while (i < str.length) {
			const a = str.charCodeAt(i++);
			const b = i < str.length ? str.charCodeAt(i++) : 0;
			const c = i < str.length ? str.charCodeAt(i++) : 0;

			const bitmap = (a << 16) | (b << 8) | c;

			output += chars.charAt((bitmap >> 18) & 63);
			output += chars.charAt((bitmap >> 12) & 63);
			output += i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : '=';
			output += i - 1 < str.length ? chars.charAt(bitmap & 63) : '=';
		}

		return output;
	} catch (error) {
		throw new Error('Failed to encode credentials for WooCommerce API');
	}
};

/**
 * Build Basic Auth header for WooCommerce API
 */
const getAuthHeader = (): string => {
	const { consumerKey, consumerSecret } = getWooCommerceConfig();
	const credentials = `${consumerKey}:${consumerSecret}`;
	return `Basic ${base64Encode(credentials)}`;
};

/**
 * WooCommerce Order Line Item interface
 */
export interface WooCommerceOrderLineItem {
	product_id: number;
	quantity: number;
	name?: string;
	price?: number;
}

/**
 * WooCommerce Order Shipping Line interface
 */
export interface WooCommerceOrderShippingLine {
	method_id: string;
	method_title: string;
	total: string;
}

/**
 * WooCommerce Order Billing Address interface
 */
export interface WooCommerceOrderBilling {
	first_name?: string;
	last_name?: string;
	company?: string;
	address_1?: string;
	address_2?: string;
	city?: string;
	state?: string;
	postcode?: string;
	country?: string;
	email?: string;
	phone?: string;
}

/**
 * WooCommerce Order Shipping Address interface
 */
export interface WooCommerceOrderShipping {
	first_name?: string;
	last_name?: string;
	company?: string;
	address_1?: string;
	address_2?: string;
	city?: string;
	state?: string;
	postcode?: string;
	country?: string;
}

/**
 * WooCommerce Order interface (based on WooCommerce REST API v3)
 */
export interface WooCommerceOrder {
	id: number;
	parent_id: number;
	status: string;
	currency: string;
	date_created: string;
	date_modified: string;
	discount_total: string;
	discount_tax: string;
	shipping_total: string;
	shipping_tax: string;
	cart_tax: string;
	total: string;
	total_tax: string;
	prices_include_tax: boolean;
	customer_id: number;
	customer_note: string;
	billing: WooCommerceOrderBilling;
	shipping: WooCommerceOrderShipping;
	payment_method: string;
	payment_method_title: string;
	transaction_id: string;
	date_paid: string | null;
	date_completed: string | null;
	cart_hash: string;
	line_items: Array<{
		id: number;
		name: string;
		product_id: number;
		variation_id: number;
		quantity: number;
		tax_class: string;
		subtotal: string;
		subtotal_tax: string;
		total: string;
		total_tax: string;
		taxes: any[];
		meta_data: any[];
		sku: string;
		price: number;
	}>;
	tax_lines: any[];
	shipping_lines: Array<{
		id: number;
		method_title: string;
		method_id: string;
		total: string;
		total_tax: string;
		taxes: any[];
		meta_data: any[];
	}>;
	fee_lines: any[];
	coupon_lines: any[];
	refunds: any[];
	meta_data: any[];
	_links: any;
}

/**
 * Create Order Request interface
 */
export interface CreateOrderRequest {
	payment_method?: string;
	payment_method_title?: string;
	set_paid?: boolean;
	customer_id?: number;
	billing?: WooCommerceOrderBilling;
	shipping?: WooCommerceOrderShipping;
	line_items: WooCommerceOrderLineItem[];
	shipping_lines?: WooCommerceOrderShippingLine[];
	meta_data?: Array<{ key: string; value: string }>;
}

/**
 * Update Order Request interface
 */
export interface UpdateOrderRequest {
	status?: string;
	set_paid?: boolean;
	date_paid?: string;
	transaction_id?: string;
	billing?: WooCommerceOrderBilling;
}

/**
 * Make API request to WooCommerce Orders API
 */
const apiRequest = async <T>(
	endpoint: string,
	method: 'GET' | 'POST' | 'PUT' = 'GET',
	body?: any,
	params?: Record<string, any>
): Promise<T> => {
	const { baseUrl } = getWooCommerceConfig();
	const authHeader = getAuthHeader();

	// Build query string for GET requests
	const queryParams = new URLSearchParams();
	if (params && method === 'GET') {
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				queryParams.append(key, String(value));
			}
		});
	}

	const url = `${baseUrl}/wp-json/wc/v3/${endpoint}${
		queryParams.toString() ? `?${queryParams.toString()}` : ''
	}`;

	console.log('[WooCommerce Orders API] Request:', {
		endpoint,
		url,
		method,
		hasBody: !!body,
		params: params || {},
	});

	try {
		const requestOptions: RequestInit = {
			method,
			headers: {
				Authorization: authHeader,
				'Content-Type': 'application/json',
			},
		};

		if (body && (method === 'POST' || method === 'PUT')) {
			requestOptions.body = JSON.stringify(body);
		}

		const response = await fetch(url, requestOptions);

		console.log('[WooCommerce Orders API] Response:', {
			status: response.status,
			statusText: response.statusText,
			ok: response.ok,
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			console.error('[WooCommerce Orders API] Error Response:', errorData);
			throw new Error(
				`WooCommerce Orders API error: ${response.status} ${
					response.statusText
				}. ${JSON.stringify(errorData)}`
			);
		}

		const data = await response.json();
		console.log('[WooCommerce Orders API] Success:', {
			endpoint,
			method,
			dataType: Array.isArray(data) ? 'array' : typeof data,
			dataLength: Array.isArray(data) ? data.length : 'N/A',
		});

		return data;
	} catch (error) {
		console.error('[WooCommerce Orders API] Exception:', {
			endpoint,
			url,
			method,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});
		if (error instanceof Error) {
			throw error;
		}
		throw new Error('Failed to make request to WooCommerce Orders API');
	}
};

/**
 * Create a new order in WooCommerce
 * @param basketItems Items from the local basket
 * @param billing Optional billing address
 * @param shipping Optional shipping address
 * @returns Created WooCommerce order
 */
export async function createOrder(
	basketItems: BasketItem[],
	billing?: WooCommerceOrderBilling,
	shipping?: WooCommerceOrderShipping
): Promise<WooCommerceOrder> {
	try {
		if (!basketItems || basketItems.length === 0) {
			throw new Error('Cannot create order: basket is empty');
		}

		// Calculate totals
		const subtotal = basketItems.reduce(
			(sum, item) => sum + (item.price ?? 0) * item.quantity,
			0
		);
		const deliveryCharge = getNextDayDeliveryCharge();
		const subtotalWithDelivery = subtotal + deliveryCharge;
		const vatRate = getVatRate();
		const vatAmount = calculateVat(subtotalWithDelivery);
		const grandTotal = subtotalWithDelivery + vatAmount;

		// Build line items
		const lineItems: WooCommerceOrderLineItem[] = basketItems.map((item) => ({
			product_id: parseInt(item.id, 10),
			quantity: item.quantity,
			name: item.name,
			price: item.price,
		}));

		// Build shipping line
		const shippingLines: WooCommerceOrderShippingLine[] = [
			{
				method_id: 'next_day_delivery',
				method_title: 'Next Day Delivery',
				total: deliveryCharge.toFixed(2),
			},
		];

		// Get or create customer ID for this device
		const customerId = await getOrCreateCustomerId();

		// Build order request
		const orderRequest: CreateOrderRequest = {
			payment_method: 'bacs',
			payment_method_title: 'Direct Bank Transfer',
			set_paid: false, // Order starts as pending payment
			customer_id: customerId, // Always associate with customer
			line_items: lineItems,
			shipping_lines: shippingLines,
		};

		// Add billing address if provided
		if (billing) {
			orderRequest.billing = billing;
		}

		// Add shipping address if provided
		if (shipping) {
			orderRequest.shipping = shipping;
		}

		console.log('[Create Order] Creating order:', {
			itemCount: basketItems.length,
			subtotal: subtotal.toFixed(2),
			deliveryCharge: deliveryCharge.toFixed(2),
			vatAmount: vatAmount.toFixed(2),
			grandTotal: grandTotal.toFixed(2),
			customerId: customerId,
		});

		const order = await apiRequest<WooCommerceOrder>(
			'orders',
			'POST',
			orderRequest
		);

		console.log('[Create Order] Order created successfully:', {
			orderId: order.id,
			status: order.status,
			total: order.total,
		});

		return order;
	} catch (error) {
		console.error('[Create Order] Error creating order:', error);
		throw error;
	}
}

/**
 * Update an existing order
 * @param orderId Order ID to update
 * @param updates Order updates (status, payment info, etc.)
 * @returns Updated WooCommerce order
 */
export async function updateOrder(
	orderId: number,
	updates: UpdateOrderRequest
): Promise<WooCommerceOrder> {
	try {
		console.log('[Update Order] Updating order:', {
			orderId,
			updates,
		});

		const order = await apiRequest<WooCommerceOrder>(
			`orders/${orderId}`,
			'PUT',
			updates
		);

		console.log('[Update Order] Order updated successfully:', {
			orderId: order.id,
			status: order.status,
			datePaid: order.date_paid,
		});

		return order;
	} catch (error) {
		console.error('[Update Order] Error updating order:', error);
		throw error;
	}
}

/**
 * Get a single order by ID
 * @param orderId Order ID
 * @returns WooCommerce order
 */
export async function getOrder(orderId: number): Promise<WooCommerceOrder> {
	try {
		return await apiRequest<WooCommerceOrder>(`orders/${orderId}`, 'GET');
	} catch (error) {
		console.error('[Get Order] Error fetching order:', error);
		throw error;
	}
}

/**
 * List orders for the current customer
 * Automatically filters by the customer ID stored on this device
 * @param status Order status filter (optional)
 * @param page Page number (default: 1)
 * @param perPage Items per page (default: 20)
 * @returns Array of WooCommerce orders for the current customer
 */
export async function listOrders(params?: {
	status?: string;
	page?: number;
	per_page?: number;
}): Promise<WooCommerceOrder[]> {
	try {
		// Get customer ID for this device
		const customerId = await getCustomerId();

		if (!customerId) {
			// No customer ID means no orders yet
			console.log('[List Orders] No customer ID found, returning empty array');
			return [];
		}

		const queryParams: Record<string, any> = {
			page: params?.page || 1,
			per_page: params?.per_page || 20,
			customer: customerId, // Always filter by customer ID
		};

		if (params?.status) {
			queryParams.status = params.status;
		}

		console.log('[List Orders] Fetching orders for customer:', {
			customerId,
			status: params?.status,
			page: queryParams.page,
			per_page: queryParams.per_page,
		});

		return await apiRequest<WooCommerceOrder[]>(
			'orders',
			'GET',
			undefined,
			queryParams
		);
	} catch (error) {
		console.error('[List Orders] Error fetching orders:', error);
		throw error;
	}
}
