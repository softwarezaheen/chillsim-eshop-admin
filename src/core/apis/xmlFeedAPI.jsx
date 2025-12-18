import { api } from "./apiInstance";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1/";

/**
 * Get list of available promo codes for XML feed
 */
export const getAvailablePromoCodes = async () => {
  try {
    const response = await fetch(
      `${API_URL}admin/bundles/impact-feed/promo-codes`,
      {
        headers: {
          "x-admin-key": import.meta.env.VITE_ADMIN_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch promo codes: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching available promo codes:", error);
    throw error;
  }
};

/**
 * Get current XML feed configuration
 */
export const getFeedConfig = async () => {
  try {
    const response = await fetch(
      `${API_URL}admin/bundles/impact-feed/config`,
      {
        headers: {
          "x-admin-key": import.meta.env.VITE_ADMIN_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch feed config: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching feed config:", error);
    throw error;
  }
};

/**
 * Update XML feed promo code configuration
 */
export const updateFeedPromoCode = async (promoCode) => {
  try {
    const response = await fetch(
      `${API_URL}admin/bundles/impact-feed/config?promo_code=${encodeURIComponent(promoCode)}`,
      {
        method: "PUT",
        headers: {
          "x-admin-key": import.meta.env.VITE_ADMIN_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to update promo code: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating feed promo code:", error);
    throw error;
  }
};

/**
 * Regenerate XML feed with current configuration
 */
export const regenerateXMLFeed = async (currency = "EUR", locale = "en") => {
  try {
    const response = await fetch(
      `${API_URL}admin/bundles/impact-feed/regenerate?currency=${currency}&locale=${locale}`,
      {
        method: "POST",
        headers: {
          "x-admin-key": import.meta.env.VITE_ADMIN_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to regenerate feed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error regenerating XML feed:", error);
    throw error;
  }
};

/**
 * Get XML feed URL for download
 */
export const getXMLFeedURL = (currency = "EUR", locale = "en") => {
  return `${API_URL}admin/bundles/impact-feed?currency=${currency}&locale=${locale}`;
};
