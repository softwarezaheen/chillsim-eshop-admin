import { api } from "./apiInstance";
import supabase from "./supabase";
import { createRefund } from "./stripeAPI";

export const getAllOrders = async ({ page, pageSize, userEmail, orderStatus, orderType, paymentType }) => {
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

    // Step 4: Merge user info into orders
    const userMap = users ? Object.fromEntries(users.map((u) => [u.id, u])) : {};

    let enrichedOrders = orderRes.data.map((order) => ({
      ...order,
      user: userMap[order.user_id] || null,
      user_email: userEmailMap[order.user_id] || userMap[order.user_id]?.metadata?.email || null,
    }));

    // Step 5: Filter by email if provided (client-side)
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
 * Refund an order via Stripe
 * @param {string} orderId - The order ID
 * @param {string} paymentIntentId - The Stripe payment intent ID
 * @param {number} amount - Optional: Amount to refund in cents
 * @returns {Promise} Refund result
 */
export const refundOrder = async ({ orderId, paymentIntentId, amount = null }) => {
  try {
    // Step 1: Create refund in Stripe
    const refundResult = await createRefund({
      paymentIntentId,
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
