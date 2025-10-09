import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY;

/**
 * Create a refund for a payment intent via backend API
 * @param {string} paymentIntentId - The payment intent ID to refund
 * @param {number} amount - Optional: Amount to refund in cents. If not provided, refunds the full amount
 * @param {string} reason - Optional: Reason for refund ('duplicate', 'fraudulent', 'requested_by_customer')
 * @returns {Promise} Refund result
 */
export const createRefund = async ({ paymentIntentId, amount = null, reason = 'requested_by_customer' }) => {
  try {
    const payload = {
      payment_intent_id: paymentIntentId,
      reason: reason,
    };

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

    return {
      success: true,
      data: response.data,
      error: null,
    };
  } catch (error) {
    console.error('Stripe refund error:', error);
    const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to create refund';
    return {
      success: false,
      data: null,
      error: errorMessage,
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
