import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY;

/**
 * Create a refund for a payment (Stripe or wallet) via backend API
 * @param {string} paymentIntentId - The payment intent ID to refund (for card payments)
 * @param {string} orderId - The order ID to refund (for wallet payments)
 * @param {number} amount - Optional: Amount to refund in cents. If not provided, refunds the full amount
 * @param {string} reason - Optional: Reason for refund ('duplicate', 'fraudulent', 'requested_by_customer')
 * @returns {Promise} Refund result
 */
export const createRefund = async ({ paymentIntentId = null, orderId = null, amount = null, reason = 'requested_by_customer' }) => {
  try {
    const payload = {
      reason: reason,
    };

    // Add either payment_intent_id or order_id based on what's provided
    if (paymentIntentId) {
      payload.payment_intent_id = paymentIntentId;
    } else if (orderId) {
      payload.order_id = orderId;
    } else {
      return {
        error: {
          code: 400,
          name: 'Invalid Request',
          details: 'Either paymentIntentId or orderId must be provided',
        },
        success: false,
      };
    }

    // Only include amount if specified (otherwise backend will refund full amount)
    if (amount !== null) {
      payload.amount = amount;
    }

    const response = await axios.post(
      `${API_URL}admin/refund`,
      payload,
      {
        headers: {
          'X-Admin-Key': ADMIN_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    // Successful response (HTTP 200)
    return {
      success: true,
      data: response.data,
      error: null,
    };
  } catch (error) {
    console.error('Stripe refund error:', error);
    
    // Handle error response from backend (HTTP 4xx, 5xx)
    if (error.response?.data) {
      const errorData = error.response.data;
      return {
        success: false,
        data: null,
        error: {
          code: errorData.code || error.response.status,
          name: errorData.name || 'Refund Error',
          details: errorData.details || errorData.message || 'Failed to create refund',
        },
      };
    }
    
    // Network or other errors
    return {
      success: false,
      data: null,
      error: {
        code: 500,
        name: 'Network Error',
        details: error.message || 'Failed to create refund',
      },
    };
  }
};

/**
 * Get refund details via backend API
 * @param {string} refundId - The refund ID
 * @returns {Promise} Stripe refund object
 */
export const getRefund = async (refundId) => {
  try {
    const response = await axios.get(
      `${API_URL}admin/refund/${refundId}`,
      {
        headers: {
          'X-Admin-Key': ADMIN_API_KEY,
        },
      }
    );

    return {
      success: true,
      data: response.data,
      error: null,
    };
  } catch (error) {
    console.error('Stripe get refund error:', error);
    const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to retrieve refund';
    return {
      success: false,
      data: null,
      error: errorMessage,
    };
  }
};

/**
 * List all refunds for a payment intent via backend API
 * @param {string} paymentIntentId - The payment intent ID
 * @returns {Promise} List of refunds
 */
export const listRefunds = async (paymentIntentId) => {
  try {
    const response = await axios.get(
      `${API_URL}admin/refunds`,
      {
        params: {
          payment_intent_id: paymentIntentId,
        },
        headers: {
          'X-Admin-Key': ADMIN_API_KEY,
        },
      }
    );

    return {
      success: true,
      data: response.data,
      error: null,
    };
  } catch (error) {
    console.error('Stripe list refunds error:', error);
    const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to list refunds';
    return {
      success: false,
      data: null,
      error: errorMessage,
    };
  }
};
