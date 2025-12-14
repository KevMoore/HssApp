# WooCommerce Store API Cart Token to Web Session Bridge

## Overview

This document describes the implementation of a custom checkout bridge that allows mobile app users to seamlessly transition from the WooCommerce Store API cart to the web-based checkout page. The bridge accepts a Store API cart token, retrieves the cart contents via the Store API, and transfers those items to the standard WooCommerce web session.

## Problem Statement

When users add items to their cart via the mobile app using the WooCommerce Store API, the cart is stored server-side and identified by a cart token. However, when redirecting users to the web checkout page (`/checkout`), the standard WooCommerce checkout relies on PHP sessions and cookies, which are separate from the Store API cart tokens. This results in an empty cart when users land on the checkout page.

## Solution Architecture

The solution involves creating a custom endpoint/page that:

1. Accepts a `cart_token` query parameter from the mobile app redirect
2. Validates the cart token and retrieves cart contents via Store API
3. Transfers cart items to the standard WooCommerce web session
4. Redirects users to the standard checkout page with their cart populated

## Implementation

### Step 1: Create Custom Checkout Bridge Endpoint

Add the following code to your theme's `functions.php` file or a custom plugin:

```php
<?php
/**
 * Custom checkout bridge endpoint for Store API cart tokens
 * 
 * Usage: https://yourstore.com/checkout-bridge/?cart_token=YOUR_CART_TOKEN
 * 
 * This endpoint:
 * 1. Accepts a cart_token query parameter
 * 2. Retrieves cart contents via Store API
 * 3. Transfers items to WooCommerce web session
 * 4. Redirects to standard checkout page
 */

/**
 * Register custom endpoint for checkout bridge
 */
function hss_register_checkout_bridge_endpoint() {
    add_rewrite_rule(
        '^checkout-bridge/?$',
        'index.php?checkout_bridge=1',
        'top'
    );
}
add_action('init', 'hss_register_checkout_bridge_endpoint');

/**
 * Add query var for checkout bridge
 */
function hss_add_checkout_bridge_query_var($vars) {
    $vars[] = 'checkout_bridge';
    return $vars;
}
add_filter('query_vars', 'hss_add_checkout_bridge_query_var');

/**
 * Handle checkout bridge requests
 */
function hss_handle_checkout_bridge() {
    global $wp_query;
    
    // Check if this is a checkout bridge request
    if (!isset($wp_query->query_vars['checkout_bridge'])) {
        return;
    }
    
    // Get cart token from query parameter
    $cart_token = isset($_GET['cart_token']) ? sanitize_text_field($_GET['cart_token']) : '';
    
    if (empty($cart_token)) {
        // No cart token provided, redirect to checkout with error message
        wp_redirect(add_query_arg('cart_error', 'missing_token', wc_get_checkout_url()));
        exit;
    }
    
    // Retrieve cart contents via Store API
    $cart_data = hss_get_cart_via_store_api($cart_token);
    
    if (is_wp_error($cart_data) || empty($cart_data['items'])) {
        // Failed to retrieve cart or cart is empty
        wp_redirect(add_query_arg('cart_error', 'invalid_cart', wc_get_checkout_url()));
        exit;
    }
    
    // Clear existing WooCommerce cart
    WC()->cart->empty_cart();
    
    // Transfer items from Store API cart to WooCommerce web session
    $transfer_success = hss_transfer_cart_items_to_woocommerce($cart_data['items']);
    
    if (!$transfer_success) {
        // Failed to transfer items
        wp_redirect(add_query_arg('cart_error', 'transfer_failed', wc_get_checkout_url()));
        exit;
    }
    
    // Optionally transfer customer data if available
    if (isset($cart_data['billing_address']) || isset($cart_data['shipping_address'])) {
        hss_transfer_customer_data($cart_data);
    }
    
    // Redirect to standard checkout page
    wp_redirect(wc_get_checkout_url());
    exit;
}
add_action('template_redirect', 'hss_handle_checkout_bridge');

/**
 * Retrieve cart contents via WooCommerce Store API
 * 
 * @param string $cart_token The Store API cart token
 * @return array|WP_Error Cart data or error
 */
function hss_get_cart_via_store_api($cart_token) {
    $store_api_url = home_url('/wp-json/wc/store/v1/cart');
    
    $response = wp_remote_get($store_api_url, array(
        'headers' => array(
            'Cart-Token' => $cart_token,
            'Content-Type' => 'application/json',
        ),
        'timeout' => 10,
    ));
    
    if (is_wp_error($response)) {
        return $response;
    }
    
    $response_code = wp_remote_retrieve_response_code($response);
    
    if ($response_code !== 200) {
        return new WP_Error(
            'store_api_error',
            sprintf('Store API returned error code: %d', $response_code),
            array('status' => $response_code)
        );
    }
    
    $body = wp_remote_retrieve_body($response);
    $cart_data = json_decode($body, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        return new WP_Error(
            'json_error',
            'Failed to parse Store API response',
            array('error' => json_last_error_msg())
        );
    }
    
    return $cart_data;
}

/**
 * Transfer cart items from Store API format to WooCommerce web session
 * 
 * @param array $store_api_items Items from Store API cart response
 * @return bool Success status
 */
function hss_transfer_cart_items_to_woocommerce($store_api_items) {
    if (empty($store_api_items) || !is_array($store_api_items)) {
        return false;
    }
    
    $success_count = 0;
    
    foreach ($store_api_items as $item) {
        // Extract product ID and quantity from Store API item
        $product_id = isset($item['id']) ? intval($item['id']) : 0;
        $quantity = isset($item['quantity']) ? intval($item['quantity']) : 1;
        
        if ($product_id <= 0) {
            continue;
        }
        
        // Check if product exists and is purchasable
        $product = wc_get_product($product_id);
        
        if (!$product || !$product->is_purchasable()) {
            error_log(sprintf(
                'HSS Cart Bridge: Product %d is not purchasable or does not exist',
                $product_id
            ));
            continue;
        }
        
        // Handle variable products if needed
        $variation_id = 0;
        $variation = array();
        
        if ($product->is_type('variable')) {
            // For variable products, you may need to handle variations
            // This is a simplified version - adjust based on your needs
            $variation_id = isset($item['variation_id']) ? intval($item['variation_id']) : 0;
            
            if ($variation_id > 0) {
                $variation_data = isset($item['variation']) && is_array($item['variation']) 
                    ? $item['variation'] 
                    : array();
                
                // Convert variation data format if needed
                foreach ($variation_data as $attr) {
                    if (isset($attr['attribute']) && isset($attr['value'])) {
                        $variation[$attr['attribute']] = $attr['value'];
                    }
                }
            }
        }
        
        // Add item to WooCommerce cart
        $cart_item_key = WC()->cart->add_to_cart(
            $product_id,
            $quantity,
            $variation_id,
            $variation
        );
        
        if ($cart_item_key) {
            $success_count++;
        } else {
            error_log(sprintf(
                'HSS Cart Bridge: Failed to add product %d to cart',
                $product_id
            ));
        }
    }
    
    // Return true if at least one item was added successfully
    return $success_count > 0;
}

/**
 * Transfer customer data (billing/shipping addresses) if available
 * 
 * @param array $cart_data Full cart data from Store API
 */
function hss_transfer_customer_data($cart_data) {
    // Set billing address if available
    if (isset($cart_data['billing_address']) && is_array($cart_data['billing_address'])) {
        $billing = $cart_data['billing_address'];
        
        WC()->customer->set_billing_first_name(isset($billing['first_name']) ? $billing['first_name'] : '');
        WC()->customer->set_billing_last_name(isset($billing['last_name']) ? $billing['last_name'] : '');
        WC()->customer->set_billing_company(isset($billing['company']) ? $billing['company'] : '');
        WC()->customer->set_billing_address_1(isset($billing['address_1']) ? $billing['address_1'] : '');
        WC()->customer->set_billing_address_2(isset($billing['address_2']) ? $billing['address_2'] : '');
        WC()->customer->set_billing_city(isset($billing['city']) ? $billing['city'] : '');
        WC()->customer->set_billing_state(isset($billing['state']) ? $billing['state'] : '');
        WC()->customer->set_billing_postcode(isset($billing['postcode']) ? $billing['postcode'] : '');
        WC()->customer->set_billing_country(isset($billing['country']) ? $billing['country'] : '');
        WC()->customer->set_billing_email(isset($billing['email']) ? $billing['email'] : '');
        WC()->customer->set_billing_phone(isset($billing['phone']) ? $billing['phone'] : '');
    }
    
    // Set shipping address if available
    if (isset($cart_data['shipping_address']) && is_array($cart_data['shipping_address'])) {
        $shipping = $cart_data['shipping_address'];
        
        WC()->customer->set_shipping_first_name(isset($shipping['first_name']) ? $shipping['first_name'] : '');
        WC()->customer->set_shipping_last_name(isset($shipping['last_name']) ? $shipping['last_name'] : '');
        WC()->customer->set_shipping_company(isset($shipping['company']) ? $shipping['company'] : '');
        WC()->customer->set_shipping_address_1(isset($shipping['address_1']) ? $shipping['address_1'] : '');
        WC()->customer->set_shipping_address_2(isset($shipping['address_2']) ? $shipping['address_2'] : '');
        WC()->customer->set_shipping_city(isset($shipping['city']) ? $shipping['city'] : '');
        WC()->customer->set_shipping_state(isset($shipping['state']) ? $shipping['state'] : '');
        WC()->customer->set_shipping_postcode(isset($shipping['postcode']) ? $shipping['postcode'] : '');
        WC()->customer->set_shipping_country(isset($shipping['country']) ? $shipping['country'] : '');
    }
    
    // Save customer data
    WC()->customer->save();
}

/**
 * Display error messages on checkout page if cart transfer failed
 */
function hss_display_cart_transfer_errors() {
    if (!is_checkout()) {
        return;
    }
    
    $error = isset($_GET['cart_error']) ? sanitize_text_field($_GET['cart_error']) : '';
    
    if (empty($error)) {
        return;
    }
    
    $messages = array(
        'missing_token' => 'Cart token was not provided. Please try again from the app.',
        'invalid_cart' => 'Unable to retrieve your cart. The cart may have expired or is invalid.',
        'transfer_failed' => 'Failed to transfer cart items. Please try again.',
    );
    
    $message = isset($messages[$error]) ? $messages[$error] : 'An error occurred while loading your cart.';
    
    wc_add_notice($message, 'error');
}
add_action('woocommerce_before_checkout_form', 'hss_display_cart_transfer_errors');
```

### Step 2: Flush Rewrite Rules

After adding the code, flush WordPress rewrite rules by:

1. Going to **Settings > Permalinks** in WordPress admin
2. Clicking **Save Changes** (no need to change anything)

Or programmatically:

```php
// Run once to flush rewrite rules (can be removed after first run)
flush_rewrite_rules();
```

## Expected URL Format

The mobile app will redirect users to:

```
https://yourstore.com/checkout-bridge/?cart_token=YOUR_CART_TOKEN
```

The bridge endpoint will then transfer the cart contents to the web session and redirect to the standard checkout page.

## Error Handling

The implementation includes error handling for:

- **Missing cart token**: Redirects to checkout with error message
- **Invalid/expired cart**: Redirects to checkout with error message
- **Transfer failures**: Redirects to checkout with error message
- **Non-purchasable products**: Logged and skipped (other items still added)

Error messages are displayed on the checkout page using WooCommerce notices.

## Security Considerations

1. **Input Sanitization**: All user inputs are sanitized using WordPress functions
2. **Token Validation**: Cart tokens are validated via Store API before processing
3. **Error Logging**: Failed operations are logged for debugging
4. **No Direct Access**: The endpoint only processes valid Store API cart tokens

## Testing Checklist

To test the checkout bridge endpoint:

1. **Obtain a valid cart token:**
   - Use the WooCommerce Store API to add items to a cart
   - Extract the `Cart-Token` from the response headers
   - Example: `GET /wp-json/wc/store/v1/cart` (returns cart token in headers)

2. **Test the bridge endpoint:**
   - [ ] Navigate to `/checkout-bridge/?cart_token={valid_token}` 
   - [ ] Verify cart items appear on checkout page after redirect
   - [ ] Test with empty cart token parameter (should show error)
   - [ ] Test with invalid cart token (should show error)
   - [ ] Test with expired cart token (should show error)
   - [ ] Test with variable products (if applicable)
   - [ ] Test with customer billing/shipping data (if provided in Store API cart)
   - [ ] Verify checkout process completes successfully
   - [ ] Verify error messages display correctly on checkout page

## Additional Notes

### Variable Products

If your store uses variable products, you may need to enhance the `hss_transfer_cart_items_to_woocommerce()` function to properly handle variation attributes. The current implementation includes basic support, but you may need to adjust based on how variations are stored in your Store API cart.

### Shipping Methods

If shipping methods were selected in the Store API cart, you may want to preserve those selections. This would require additional code to transfer shipping method selections to the web session.

### Coupons

If coupons were applied in the Store API cart, you may want to reapply them in the web session. Check the `coupons` array in the Store API cart response and apply them using `WC()->cart->apply_coupon()`.

### Performance

The bridge endpoint makes an additional HTTP request to the Store API. Consider caching cart data if needed, but be aware of cart expiration times.

## Support

For questions or issues with this implementation, please refer to:

- [WooCommerce Store API Documentation](https://developer.woocommerce.com/docs/apis/store-api/)
- [WooCommerce Cart Tokens Documentation](https://developer.woocommerce.com/docs/apis/store-api/cart-tokens/)
- [WooCommerce Cart API Documentation](https://developer.woocommerce.com/docs/apis/store-api/resources-endpoints/cart/)

