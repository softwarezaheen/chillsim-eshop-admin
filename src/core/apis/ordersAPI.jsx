import { api } from "./apiInstance";
import supabase from "./supabase";
import { createRefund } from "./stripeAPI";

export const getAllOrders = async ({ page, pageSize, userEmail, orderStatus, orderType, paymentType, fromDate, toDate }) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  try {
    // Step 1: Fetch orders with filters (except email - that's applied later)
    const orderRes = await api(() => {
      let query = supabase
        .from("user_order")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (orderStatus) {
        query = query.eq("payment_status", orderStatus);
      }

      if (orderType) {
        query = query.eq("order_type", orderType);
      }

      if (paymentType) {
        query = query.ilike("payment_type", paymentType);
      }

      // Date range filters (expecting YYYY-MM-DD format without timezone)
      if (fromDate) {
        // Add time to start of day in UTC
        query = query.gte("created_at", `${fromDate}T00:00:00.000Z`);
      }

      if (toDate) {
        // Include entire day up to 23:59:59.999
        query = query.lte("created_at", `${toDate}T23:59:59.999Z`);
      }

      // Note: Email filter cannot be applied here as emails are in auth.users
      // We'll need to fetch more data if email filter is active
      if (!userEmail) {
        query = query.range(from, to);
      }

      return query;
    });

    if (!orderRes.data || orderRes.data.length === 0) {
      return {
        ...orderRes,
        data: [],
        count: 0,
      };
    }

    // Filter out NULL user_ids before fetching user data
    const userIds = [...new Set(orderRes.data.map((order) => order.user_id).filter(id => id !== null))];

    // Step 2: Fetch user emails from auth.users using admin API (only if we have valid user IDs)
    let relevantAuthUsers = [];
    if (userIds.length > 0) {
      const { data: allAuthUsersResponse } = await supabase.auth.admin.listUsers();
      relevantAuthUsers = allAuthUsersResponse?.users?.filter(u => userIds.includes(u.id)) || [];
    }

    // Create a map of user_id to email
    const userEmailMap = Object.fromEntries(
      relevantAuthUsers.map((u) => [u.id, u.email])
    );

    // Step 3: Fetch user_copy info for additional metadata (phone, etc.)
    let users = [];
    if (userIds.length > 0) {
      const { data: usersData, error } = await supabase
        .from("users_copy")
        .select("id,metadata")
        .in("id", userIds);

      if (error) {
        console.error("Failed to fetch users_copy:", error);
      } else {
        users = usersData || [];
      }
    }

    // Step 4: Fetch billing information for all user emails
    // Collect all possible emails from both auth users and users_copy metadata
    const userMap = users ? Object.fromEntries(users.map((u) => [u.id, u])) : {};
    const allEmails = new Set();
    
    relevantAuthUsers.forEach(u => {
      if (u.email) allEmails.add(u.email.toLowerCase().trim());
    });
    
    users.forEach(u => {
      const metadataEmail = u.metadata?.email;
      if (metadataEmail) allEmails.add(metadataEmail.toLowerCase().trim());
    });
    
    let billingInfoMap = {};
    if (allEmails.size > 0) {
      const { data: billingData, error: billingError } = await supabase
        .from("billing_information")
        .select("email, country");

      if (billingError) {
        console.error("Failed to fetch billing information:", billingError);
      } else if (billingData) {
        // Create map with normalized (lowercase) email keys for case-insensitive lookup
        billingInfoMap = Object.fromEntries(
          billingData.map(b => [b.email.toLowerCase().trim(), b.country])
        );
      }
    }

    // Step 5: Fetch currency exchange rates
    const { data: currencyData, error: currencyError } = await supabase
      .from("currency")
      .select("name, rate, default_currency");

    let currencyRates = {};
    if (currencyError) {
      console.error("Failed to fetch currency rates:", currencyError);
    } else if (currencyData) {
      // Create a map of currency name to rate (rate is relative to default_currency which should be EUR)
      currencyRates = Object.fromEntries(
        currencyData.map(c => [c.name, { rate: c.rate, default_currency: c.default_currency }])
      );
    }

    // Step 6: Merge user info into orders

    let enrichedOrders = orderRes.data.map((order) => {
      const userEmail = userEmailMap[order.user_id] || userMap[order.user_id]?.metadata?.email || null;
      // Normalize email for case-insensitive lookup
      const billingCountry = userEmail ? billingInfoMap[userEmail.toLowerCase().trim()] : null;
      
      // Calculate EUR amount
      let eurAmount = null;
      if (order.currency && order.currency.toUpperCase() === 'EUR') {
        // Already in EUR
        eurAmount = calculateTotalAmount(order);
      } else if (order.currency && currencyRates[order.currency]) {
        // Convert to EUR using the exchange rate
        const totalAmount = calculateTotalAmount(order);
        const rate = currencyRates[order.currency].rate;
        eurAmount = totalAmount / rate;
      }

      return {
        ...order,
        user: userMap[order.user_id] || null,
        user_email: userEmail,
        billing_country: billingCountry,
        eur_amount: eurAmount,
        currency_rate: order.currency ? currencyRates[order.currency]?.rate : null,
      };
    });

    // Helper function to calculate total amount
    function calculateTotalAmount(order) {
      const modifiedAmount = order.modified_amount || 0;
      const fee = order.fee || 0;
      const vat = order.vat || 0;
      
      // For inclusive tax mode, VAT is already included in the amount
      // For exclusive tax mode (or none), VAT needs to be added
      const taxMode = order.tax_mode || 'exclusive';
      const vatToAdd = taxMode === 'inclusive' ? 0 : vat;
      
      return (modifiedAmount + fee + vatToAdd) / 100; // Convert from cents
    }

    // Step 7: Filter by email if provided (client-side)
    if (userEmail) {
      enrichedOrders = enrichedOrders.filter(order => 
        order.user_email?.toLowerCase().includes(userEmail.toLowerCase())
      );
      
      // Apply pagination manually after filtering
      const paginatedOrders = enrichedOrders.slice(from, to + 1);
      
      return {
        data: paginatedOrders,
        count: enrichedOrders.length,
        error: null,
      };
    }

    return {
      ...orderRes,
      data: enrichedOrders,
    };
  } catch (error) {
    console.error("Merge user info into orders failed:", error);
    throw error;
  }
};

/**
 * Get order statistics for infographics (all orders in date range, not paginated)
 */
export const getOrderStatistics = async ({ fromDate, toDate }) => {
  try {
    // Fetch all orders matching only date filters - handle pagination to get all records
    let allOrders = [];
    let hasMore = true;
    let rangeStart = 0;
    const pageSize = 1000; // Supabase max limit

    while (hasMore) {
      const rangeEnd = rangeStart + pageSize - 1;
      
      const orderRes = await api(() => {
        let query = supabase
          .from("user_order")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(rangeStart, rangeEnd);

        // Date range filters only (expecting YYYY-MM-DD format without timezone)
        if (fromDate) {
          query = query.gte("created_at", `${fromDate}T00:00:00.000Z`);
        }

        if (toDate) {
          // Include entire day up to 23:59:59.999
          query = query.lte("created_at", `${toDate}T23:59:59.999Z`);
        }

        return query;
      });

      if (!orderRes.data || orderRes.data.length === 0) {
        hasMore = false;
      } else {
        allOrders = [...allOrders, ...orderRes.data];
        
        // Check if we've fetched all records
        if (orderRes.data.length < pageSize) {
          hasMore = false;
        } else {
          rangeStart += pageSize;
        }
      }
    }

    if (allOrders.length === 0) {
      return {
        successCount: 0,
        totalCount: 0,
        totalRevenueEUR: 0,
        topCountries: [],
        pendingCount: 0,
        refundedCount: 0,
        avgOrderValue: 0,
      };
    }

    const orders = allOrders;

    // Fetch currency exchange rates
    const { data: currencyData } = await supabase
      .from("currency")
      .select("name, rate, default_currency");

    const currencyRates = currencyData 
      ? Object.fromEntries(currencyData.map(c => [c.name, { rate: c.rate, default_currency: c.default_currency }]))
      : {};

    // Fetch billing information for all orders
    const userIds = [...new Set(orders.map((order) => order.user_id).filter(id => id !== null))];
    let billingInfoMap = {};
    
    if (userIds.length > 0) {
      // Fetch user emails with pagination
      let allAuthUsers = [];
      let page = 1;
      let hasMoreUsers = true;
      const perPage = 1000;

      while (hasMoreUsers) {
        const { data: authUsersResponse } = await supabase.auth.admin.listUsers({
          page,
          perPage,
        });
        
        if (authUsersResponse?.users && authUsersResponse.users.length > 0) {
          allAuthUsers = [...allAuthUsers, ...authUsersResponse.users];
          
          // Check if we got a full page (indicating there might be more)
          if (authUsersResponse.users.length < perPage) {
            hasMoreUsers = false;
          } else {
            page++;
          }
        } else {
          hasMoreUsers = false;
        }
      }

      const relevantAuthUsers = allAuthUsers.filter(u => userIds.includes(u.id));
      const userIdToEmailMap = Object.fromEntries(relevantAuthUsers.map((u) => [u.id, u.email]));
      
      // Fetch all billing information
      const { data: billingData } = await supabase
        .from("billing_information")
        .select("email, country");

      if (billingData) {
        // Create map from email to country (normalized)
        const emailToCountryMap = Object.fromEntries(
          billingData.map(b => [b.email.toLowerCase().trim(), b.country])
        );
        
        // Map user_id to billing country
        userIds.forEach(userId => {
          const email = userIdToEmailMap[userId];
          if (email) {
            const country = emailToCountryMap[email.toLowerCase().trim()];
            if (country) {
              billingInfoMap[userId] = country;
            }
          }
        });
      }
    }

    // Helper function to calculate total amount
    const calculateTotalAmount = (order) => {
      const modifiedAmount = order.modified_amount || 0;
      const fee = order.fee || 0;
      const vat = order.vat || 0;
      return (modifiedAmount + fee + vat) / 100;
    };

    // Calculate EUR amounts for all orders
    const ordersWithEUR = orders.map(order => {
      let eurAmount = null;
      if (order.currency && order.currency.toUpperCase() === 'EUR') {
        eurAmount = calculateTotalAmount(order);
      } else if (order.currency && currencyRates[order.currency]) {
        const totalAmount = calculateTotalAmount(order);
        const rate = currencyRates[order.currency].rate;
        eurAmount = totalAmount / rate;
      }
      return { 
        ...order, 
        eur_amount: eurAmount,
        billing_country: billingInfoMap[order.user_id] || null
      };
    });

    // Calculate statistics
    const successOrders = ordersWithEUR.filter(order => order.payment_status === 'success');
    const pendingOrders = ordersWithEUR.filter(order => order.payment_status === 'pending');
    const refundedOrders = ordersWithEUR.filter(order => order.payment_status === 'refunded');
    const totalRevenueEUR = successOrders.reduce((sum, order) => sum + (order.eur_amount || 0), 0);
    const avgOrderValue = successOrders.length > 0 ? totalRevenueEUR / successOrders.length : 0;

    // Calculate unique paying customers (distinct user_id from successful orders)
    const payingCustomers = new Set(
      successOrders
        .map(order => order.user_id)
        .filter(id => id !== null)
    );
    const payingCustomersCount = payingCustomers.size;
    const avgOrdersPerCustomer = payingCustomersCount > 0 ? successOrders.length / payingCustomersCount : 0;

    // Calculate top 3 countries by successful orders count and revenue
    const countryStats = {};
    successOrders.forEach(order => {
      const country = order.billing_country;
      if (country) {
        if (!countryStats[country]) {
          countryStats[country] = {
            country: country,
            count: 0,
            revenue: 0,
          };
        }
        countryStats[country].count += 1;
        countryStats[country].revenue += order.eur_amount || 0;
      }
    });

    // Sort by count (primary) and revenue (secondary), then take top 3
    const topCountries = Object.values(countryStats)
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return b.revenue - a.revenue;
      })
      .slice(0, 3);

    return {
      successCount: successOrders.length,
      totalCount: orders.length,
      totalRevenueEUR: totalRevenueEUR,
      topCountries: topCountries,
      pendingCount: pendingOrders.length,
      refundedCount: refundedOrders.length,
      avgOrderValue: avgOrderValue,
      payingCustomersCount: payingCustomersCount,
      avgOrdersPerCustomer: avgOrdersPerCustomer,
    };
  } catch (error) {
    console.error("Failed to fetch order statistics:", error);
    return {
      successCount: 0,
      totalCount: 0,
      totalRevenueEUR: 0,
      topCountries: [],
      pendingCount: 0,
      refundedCount: 0,
      avgOrderValue: 0,
      payingCustomersCount: 0,
      avgOrdersPerCustomer: 0,
    };
  }
};

/**
 * Refund an order (works for both Stripe and wallet payments)
 * @param {string} orderId - The order ID
 * @param {string} paymentIntentId - The Stripe payment intent ID (for card payments)
 * @param {number} amount - Optional: Amount to refund in cents
 * @returns {Promise} Refund result
 */
export const refundOrder = async ({ orderId, paymentIntentId = null, amount = null }) => {
  try {
    // Step 1: Create refund via API (supports both Stripe and wallet)
    const refundResult = await createRefund({
      paymentIntentId,
      orderId: paymentIntentId ? null : orderId,  // Use orderId for wallet payments
      amount,
      reason: 'requested_by_customer',
    });

    if (!refundResult.success) {
      return {
        error: refundResult.error,
        success: false,
      };
    }

    // Step 2: Update order status in database
    const { data, error } = await supabase
      .from("user_order")
      .update({
        payment_status: "refunded",
        order_status: "refunded",
      })
      .eq("id", orderId)
      .select();

    if (error) {
      console.error("Failed to update order status:", error);
      return {
        error: "Refund created but failed to update order status",
        success: false,
        refundData: refundResult.data,
      };
    }

    return {
      success: true,
      data: data[0],
      refundData: refundResult.data,
      error: null,
    };
  } catch (error) {
    console.error("Refund order failed:", error);
    return {
      error: error.message || "Failed to refund order",
      success: false,
    };
  }
};

/**
 * Get ICCID for an order by looking up user_profile
 * @param {string} orderId - The order ID
 * @returns {Promise<{iccid: string|null, error: string|null}>}
 */
export const getOrderIccid = async (orderId) => {
  try {
    const { data, error } = await supabase
      .from("user_profile")
      .select("iccid")
      .eq("user_order_id", orderId)
      .limit(1)
      .maybeSingle();

    if (error) {
      return { iccid: null, error: error.message };
    }
    return { iccid: data?.iccid || null, error: null };
  } catch (e) {
    return { iccid: null, error: e.message };
  }
};
