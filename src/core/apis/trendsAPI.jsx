import supabase from "./supabase";
import { api } from "./apiInstance";

/**
 * Get trends data for revenue, orders, and customers
 * @param {string} timeRange - 'current_year' or 'all_time'
 */
export const getTrendsData = async (timeRange = 'current_year') => {
  try {
    const currentYear = new Date().getFullYear();
    const startDate = timeRange === 'current_year' 
      ? `${currentYear}-01-01T00:00:00.000Z`
      : null;

    // Fetch all orders with pagination
    let allOrders = [];
    let hasMore = true;
    let rangeStart = 0;
    const pageSize = 1000;

    while (hasMore) {
      const rangeEnd = rangeStart + pageSize - 1;
      
      const orderRes = await api(() => {
        let query = supabase
          .from("user_order")
          .select("created_at, payment_status, currency, modified_amount, fee, vat")
          .order("created_at", { ascending: true })
          .range(rangeStart, rangeEnd);

        if (startDate) {
          query = query.gte("created_at", startDate);
        }

        return query;
      });

      if (!orderRes.data || orderRes.data.length === 0) {
        hasMore = false;
      } else {
        allOrders = [...allOrders, ...orderRes.data];
        
        if (orderRes.data.length < pageSize) {
          hasMore = false;
        } else {
          rangeStart += pageSize;
        }
      }
    }

    // Fetch currency rates
    const { data: currencyData } = await supabase
      .from("currency")
      .select("name, rate");

    const currencyRates = currencyData 
      ? Object.fromEntries(currencyData.map(c => [c.name, c.rate]))
      : {};

    // Helper to calculate EUR amount
    const calculateEurAmount = (order) => {
      const totalAmount = ((order.modified_amount || 0) + (order.fee || 0) + (order.vat || 0)) / 100;
      
      if (order.currency && order.currency.toUpperCase() === 'EUR') {
        return totalAmount;
      } else if (order.currency && currencyRates[order.currency]) {
        return totalAmount / currencyRates[order.currency];
      }
      return 0;
    };

    // Process revenue by month with year separation for comparison
    const revenueByMonth = {};
    const ordersByMonth = {};
    
    allOrders.forEach(order => {
      const date = new Date(order.created_at);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

      // Initialize month data
      if (!revenueByMonth[monthKey]) {
        revenueByMonth[monthKey] = { month: monthLabel, revenue: 0, sortKey: monthKey, year, monthNum: month };
      }
      if (!ordersByMonth[monthKey]) {
        ordersByMonth[monthKey] = { month: monthLabel, successful: 0, pending: 0, total: 0, sortKey: monthKey, year, monthNum: month };
      }

      // Count orders
      ordersByMonth[monthKey].total += 1;
      if (order.payment_status === 'success') {
        ordersByMonth[monthKey].successful += 1;
        // Add revenue only for successful orders
        revenueByMonth[monthKey].revenue += calculateEurAmount(order);
      } else if (order.payment_status === 'pending') {
        ordersByMonth[monthKey].pending += 1;
      }
    });

    // Fetch customers (users created)
    let allUsers = [];
    let hasMoreUsers = true;
    let userPage = 1;
    const perPage = 1000;

    while (hasMoreUsers) {
      const { data: authUsersResponse } = await supabase.auth.admin.listUsers({
        page: userPage,
        perPage,
      });
      
      if (authUsersResponse?.users && authUsersResponse.users.length > 0) {
        allUsers = [...allUsers, ...authUsersResponse.users];
        
        if (authUsersResponse.users.length < perPage) {
          hasMoreUsers = false;
        } else {
          userPage++;
        }
      } else {
        hasMoreUsers = false;
      }
    }

    // Process customers by month with year separation
    const customersByMonth = {};
    
    allUsers.forEach(user => {
      if (!user.created_at) return;
      
      const date = new Date(user.created_at);
      
      // Filter by time range
      if (startDate && date < new Date(startDate)) {
        return;
      }
      
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

      if (!customersByMonth[monthKey]) {
        customersByMonth[monthKey] = { month: monthLabel, count: 0, sortKey: monthKey, year, monthNum: month };
      }
      customersByMonth[monthKey].count += 1;
    });

    // Helper to calculate YoY comparison
    const addYoYComparison = (dataByMonth) => {
      const sorted = Object.values(dataByMonth).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
      
      return sorted.map(item => {
        const lastYearKey = `${item.year - 1}-${String(item.monthNum).padStart(2, '0')}`;
        const lastYearData = dataByMonth[lastYearKey];
        
        const result = { ...item };
        delete result.sortKey;
        delete result.year;
        delete result.monthNum;
        
        if (lastYearData) {
          result.lastYear = {};
          result.growth = {};
          
          // Copy all numeric fields for comparison
          Object.keys(item).forEach(key => {
            if (typeof item[key] === 'number' && key !== 'year' && key !== 'monthNum') {
              result.lastYear[key] = lastYearData[key] || 0;
              const diff = item[key] - (lastYearData[key] || 0);
              result.growth[key] = {
                absolute: diff,
                percentage: lastYearData[key] ? ((diff / lastYearData[key]) * 100) : (item[key] > 0 ? 100 : 0)
              };
            }
          });
        }
        
        return result;
      });
    };

    // Convert to sorted arrays with YoY comparison
    const revenue = addYoYComparison(revenueByMonth);
    const orders = addYoYComparison(ordersByMonth);
    const customers = addYoYComparison(customersByMonth);

    return {
      revenue,
      orders,
      customers,
      error: null,
    };
  } catch (error) {
    console.error("Failed to fetch trends data:", error);
    return {
      revenue: [],
      orders: [],
      customers: [],
      error: error.message,
    };
  }
};
