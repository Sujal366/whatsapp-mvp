import supabase from "../supabaseClient.js";
import hubspotService from "../services/hubspotService.js";
import whatsappNotificationService from "../services/whatsappNotificationService.js";

// In-memory state for agent actions (until database columns are added)
const orderActionState = new Map();

// Helper function to get current agent actions for an order
function getAgentActions(orderId) {
  if (!orderActionState.has(orderId)) {
    orderActionState.set(orderId, {
      photo_captured: false,
      signature_captured: false,
      kyc_completed: false
    });
  }
  return orderActionState.get(orderId);
}

// Helper function to update agent actions
function updateAgentAction(orderId, action, value) {
  const actions = getAgentActions(orderId);
  actions[action] = value;
  orderActionState.set(orderId, actions);
  return actions;
}

// Calculate order status based on completed agent actions from database
function calculateOrderStatusFromDatabase(orderData) {
  const { photo_captured, signature_captured, kyc_completed } = orderData;
  
  // Count completed actions from database flags
  const completedActions = [photo_captured, signature_captured, kyc_completed].filter(Boolean).length;
  
  if (completedActions === 0) {
    return "pending"; // No agent actions completed
  } else if (completedActions === 3) {
    return "completed"; // All agent actions done
  } else if (photo_captured && signature_captured) {
    return "delivered"; // Delivery confirmed (photo + signature)
  } else {
    return "in_progress"; // Some actions started but not delivered yet
  }
}

// Legacy function for in-memory calculation (kept for compatibility)
function calculateOrderStatus(order) {
  const { photo_captured, signature_captured, kyc_completed } = order;
  
  // Count completed actions
  const completedActions = [photo_captured, signature_captured, kyc_completed].filter(Boolean).length;
  
  if (completedActions === 0) {
    return "pending"; // No agent actions completed
  } else if (completedActions === 3) {
    return "completed"; // All agent actions done
  } else if (photo_captured && signature_captured) {
    return "delivered"; // Delivery confirmed (photo + signature)
  } else {
    return "in_progress"; // Some actions started but not delivered yet
  }
};

const createOrder = async (req, res) => {
  try {
    const { items, customerPhone, customerName } = req.body; // Added customer info for CRM

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items are required" });
    }

    // Calculate total and prepare order items
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      let product;

      // Handle both WhatsApp format (name-based) and API format (product_id-based)
      if (item.name && !item.product_id) {
        // WhatsApp format: find product by name (case-insensitive)
        const { data: productData, error: productError } = await supabase
          .from("products")
          .select("*")
          .ilike("name", `%${item.name.trim()}%`)
          .limit(1);

        if (productError || !productData || productData.length === 0) {
          return res.status(400).json({
            error: `Product '${item.name}' not found. Available products: apples, milk, bread, bananas, rice`,
          });
        }
        product = productData[0];
      } else if (item.product_id) {
        // API format: find product by ID
        const { data: productData, error: productError } = await supabase
          .from("products")
          .select("*")
          .eq("id", item.product_id)
          .single();

        if (productError || !productData) {
          return res
            .status(400)
            .json({ error: `Product with ID ${item.product_id} not found` });
        }
        product = productData;
      } else {
        return res
          .status(400)
          .json({ error: "Each item must have either 'name' or 'product_id'" });
      }

      const quantity = parseInt(item.quantity) || 1;
      const itemTotal = product.price * quantity;
      total += itemTotal;

      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: quantity,
        unit_price: product.price,
        total_price: itemTotal,
      });
    }

    // Create order without user requirement for now (WhatsApp orders)
    let userId = req.user?.id; // If authenticated

    if (!userId) {
      // For WhatsApp orders, use the bot user (id: 2)
      userId = 2; // WhatsApp Bot User
    }

    // Insert order with customer information
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          user_id: userId,
          total_amount: total,
          status: "pending",
          customer_phone: customerPhone,
          customer_name: customerName,
        },
      ])
      .select()
      .single();

    if (orderError) {
      return res
        .status(500)
        .json({ error: "Failed to create order: " + orderError.message });
    }

    // Insert order items
    const orderItemsToInsert = orderItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.total_price,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsToInsert);

    if (itemsError) {
      return res
        .status(500)
        .json({ error: "Failed to create order items: " + itemsError.message });
    }

    // Return success response
    const orderData = {
      orderId: order.id,
      total: total,
      items: orderItems,
      customerPhone: customerPhone,
      customerName: customerName,
      status: order.status,
      createdAt: order.created_at,
    };

    // 🚀 CRM INTEGRATION: Create contact and deal in HubSpot
    try {
      if (customerPhone) {
        console.log("📞 Starting HubSpot integration for order:", order.id);

        // Create or update contact in HubSpot
        const hubspotContact = await hubspotService.createOrUpdateContact(
          customerPhone,
          customerName
        );

        // Create deal in HubSpot
        if (hubspotContact) {
          await hubspotService.createDeal(orderData, hubspotContact.id);
        } else {
          // Create deal without contact association
          await hubspotService.createDeal(orderData);
        }

        // Send webhook notifications to external systems
        const webhookUrls = process.env.EXTERNAL_WEBHOOKS?.split(",") || [];
        for (const webhookUrl of webhookUrls) {
          if (webhookUrl.trim()) {
            await hubspotService.sendWebhookNotification(
              orderData,
              webhookUrl.trim()
            );
          }
        }
      }
    } catch (crmError) {
      // Don't fail the order if CRM integration fails
      console.error(
        "⚠️ CRM integration error (order still created):",
        crmError.message
      );
    }

    res.status(201).json({
      success: true,
      orderId: order.id,
      total: total,
      items: orderItems,
      message: `Order placed successfully! Order ID: ${order.id}, Total: ₹${total}`,
    });
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({ error: "Internal server error: " + err.message });
  }
};

const getOrders = async (req, res) => {
  try {
    // For delivery agents, show all orders regardless of user_id
    // In production, you might filter by assigned agent or region
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items (
          id,
          product_id,
          quantity,
          price,
          products (
            name,
            price
          )
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Orders fetch error:", error);
      return res.status(500).json({ error: error.message });
    }

    // Use database columns for all data (fully persisted across restarts!)
    const ordersWithStatus = (data || []).map(order => {
      return {
        ...order,
        // All data now comes from database - persisted across restarts!
        status: order.status,
        photo_captured: order.photo_captured || false,
        signature_captured: order.signature_captured || false,
        kyc_completed: order.kyc_completed || false,
      };
    });

    console.log(`📦 API: Returning ${ordersWithStatus.length} orders with persistent database data`);
    res.json(ordersWithStatus);
  } catch (err) {
    console.error("Orders API error:", err);
    res.status(500).json({ error: "Internal server error: " + err.message });
  }
};

// Get single order by ID with order items
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    console.log(`📦 API: Fetching order details for ID: ${id}`);

    // First get the order
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (orderError || !orderData) {
      console.log(`❌ Order ${id} not found:`, orderError?.message);
      return res.status(404).json({ error: "Order not found" });
    }

    // Get order items with product details
    const { data: itemsData, error: itemsError } = await supabase
      .from("order_items")
      .select(
        `
        id,
        quantity,
        price,
        products (
          id,
          name
        )
      `
      )
      .eq("order_id", id);

    if (itemsError) {
      console.log(`❌ Error fetching order items:`, itemsError.message);
      return res.status(500).json({ error: "Failed to fetch order items" });
    }

    // Format the order items for the frontend
    const formattedItems = itemsData.map((item) => ({
      id: item.id,
      product_name: item.products.name,
      quantity: item.quantity,
      price: item.price,
    }));

    // Use database columns for all data (fully persisted across restarts!)
    const orderWithItems = {
      ...orderData,
      items: formattedItems,
      // All data now comes from database - persisted across restarts!
      status: orderData.status,
      photo_captured: orderData.photo_captured || false,
      signature_captured: orderData.signature_captured || false,
      kyc_completed: orderData.kyc_completed || false,
    };

    console.log(
      `✅ API: Returning order ${id} with ${formattedItems.length} items, status: ${orderData.status}, persistent data`
    );
    res.json({ order: orderWithItems });
  } catch (err) {
    console.error("Get order by ID error:", err);
    res.status(500).json({ error: "Internal server error: " + err.message });
  }
};

// Save delivery photo
const saveDeliveryPhoto = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { photoData } = req.body;

    if (!photoData) {
      return res.status(400).json({ error: "Photo data is required" });
    }

    // Save photo data to database (now with proper columns!)
    console.log(`📸 Photo saved for order ${orderId}`);

    // Get order details first to retrieve customer phone and current flags
    const { data: orderData, error: orderFetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderFetchError) {
      console.error('Failed to fetch order for notifications:', orderFetchError);
    }

    // Update agent actions and calculate new order status using database values
    const updatedActions = updateAgentAction(orderId, 'photo_captured', true);
    
    // Update the order with photo completion in the database
    const updateData = { 
      photo_captured: true,
      photo_captured_at: new Date().toISOString()
    };
    
    // Calculate new status based on current database state + this new action
    const currentStatus = {
      photo_captured: true, // This action we're completing
      signature_captured: orderData?.signature_captured || false,
      kyc_completed: orderData?.kyc_completed || false
    };
    const newStatus = calculateOrderStatusFromDatabase(currentStatus);
    updateData.status = newStatus;

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to update order in database:', updateError);
      // Continue anyway, don't fail the request
    } else {
      console.log(`✅ Order ${orderId}: status=${newStatus}, photo_captured=true`);
    }

    // 📱 Send WhatsApp notification to customer
    try {
      // Use customer_phone from order, or fallback to test number for existing orders
      const customerPhone = orderData?.customer_phone || '+918355954296';
      
      if (customerPhone) {
        await whatsappNotificationService.notifyPhotoCapture(
          customerPhone,
          orderId
        );
        console.log(`📱 Photo capture notification sent to ${customerPhone}`);
      } else {
        console.log('⚠️ No customer phone found for photo notification');
      }
    } catch (notificationError) {
      console.error('Failed to send photo notification:', notificationError);
      // Don't fail the main request for notification failures
    }

    // Return success response with updated data
    res.json({
      message: "Photo saved successfully",
      order: {
        id: orderId,
        photo_captured: true,
        photo_captured_at: new Date().toISOString(),
        status: newStatus,
      },
    });
  } catch (err) {
    console.error("Save photo error:", err);
    res.status(500).json({ error: "Internal server error: " + err.message });
  }
};

// Save customer signature
const saveCustomerSignature = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { signatureData, customerName } = req.body;

    if (!signatureData || !customerName) {
      return res
        .status(400)
        .json({ error: "Signature data and customer name are required" });
    }

    // Save signature data to database (now with proper columns!)
    console.log(`✍️ Signature saved for order ${orderId} by ${customerName}`);

    // Get order details first to retrieve customer phone and current flags
    const { data: orderData, error: orderFetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderFetchError) {
      console.error('Failed to fetch order for notifications:', orderFetchError);
    }

    // Update agent actions and calculate new order status using database values
    const updatedActions = updateAgentAction(orderId, 'signature_captured', true);
    
    // Update the order with signature completion in the database
    const updateData = { 
      signature_captured: true,
      signature_captured_at: new Date().toISOString(),
      customer_name: customerName
    };
    
    // Calculate new status based on current database state + this new action
    const currentStatus = {
      photo_captured: orderData?.photo_captured || false,
      signature_captured: true, // This action we're completing
      kyc_completed: orderData?.kyc_completed || false
    };
    const newStatus = calculateOrderStatusFromDatabase(currentStatus);
    updateData.status = newStatus;

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to update order in database:', updateError);
      // Continue anyway, don't fail the request
    } else {
      console.log(`✅ Order ${orderId}: status=${newStatus}, signature_captured=true`);
    }

    // 📱 Send WhatsApp notification to customer
    try {
      // Use customer_phone from order, or fallback to test number for existing orders
      const customerPhone = orderData?.customer_phone || '+918355954296';
      
      if (customerPhone) {
        await whatsappNotificationService.notifyDeliveryComplete(
          customerPhone,
          orderId,
          customerName
        );
        console.log(`📱 Delivery complete notification sent to ${customerPhone}`);
      } else {
        console.log('⚠️ No customer phone found for delivery notification');
      }
    } catch (notificationError) {
      console.error('Failed to send delivery notification:', notificationError);
      // Don't fail the main request for notification failures
    }

    res.json({
      message: "Signature saved successfully",
      order: {
        id: orderId,
        signature_captured: true,
        signature_captured_at: new Date().toISOString(),
        customer_name: customerName,
        status: newStatus,
      },
    });
  } catch (err) {
    console.error("Save signature error:", err);
    res.status(500).json({ error: "Internal server error: " + err.message });
  }
};

// Save KYC data
const saveKYCData = async (req, res) => {
  try {
    const { orderId } = req.params;
    const kycData = req.body;

    if (!kycData.fullName || !kycData.phoneNumber) {
      return res
        .status(400)
        .json({ error: "Full name and phone number are required" });
    }

    // Save KYC data to database (now with proper columns!)
    console.log(`👤 KYC completed for order ${orderId} - ${kycData.fullName}`);

    // Get order details first to retrieve customer phone
    const { data: orderData, error: orderFetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderFetchError) {
      console.error('Failed to fetch order for notifications:', orderFetchError);
    }

    // Update agent actions and calculate new order status using database values
    const updatedActions = updateAgentAction(orderId, 'kyc_completed', true);
    
    // Update the order with KYC completion in the database
    const updateData = { 
      kyc_completed: true,
      kyc_completed_at: new Date().toISOString(),
      kyc_data: kycData
    };
    
    // Calculate new status based on current database state + this new action
    const currentStatus = {
      photo_captured: orderData?.photo_captured || false,
      signature_captured: orderData?.signature_captured || false,
      kyc_completed: true // This action we're completing
    };
    const newStatus = calculateOrderStatusFromDatabase(currentStatus);
    updateData.status = newStatus;

    // Update the order with KYC completion in the database
    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to update order in database:', updateError);
      // Continue anyway, don't fail the request
    } else {
      console.log(`✅ Order ${orderId}: status=${newStatus}, kyc_completed=true`);
    }

    // 📱 Send WhatsApp notification to customer
    try {
      // Use customer_phone from order, or fallback to test number for existing orders
      const customerPhone = orderData?.customer_phone || '+918355954296';
      
      if (customerPhone) {
        await whatsappNotificationService.notifyKYCComplete(
          customerPhone,
          orderId,
          kycData.fullName
        );
        console.log(`📱 KYC complete notification sent to ${customerPhone}`);
      } else {
        console.log('⚠️ No customer phone found for KYC notification');
      }
    } catch (notificationError) {
      console.error('Failed to send KYC notification:', notificationError);
      // Don't fail the main request for notification failures
    }

    res.json({
      message: "KYC data saved successfully",
      order: {
        id: orderId,
        kyc_completed: true,
        kyc_completed_at: new Date().toISOString(),
        kyc_data: kycData,
        status: newStatus,
      },
    });
  } catch (err) {
    console.error("Save KYC error:", err);
    res.status(500).json({ error: "Internal server error: " + err.message });
  }
};

export {
  createOrder,
  getOrders,
  getOrderById,
  saveDeliveryPhoto,
  saveCustomerSignature,
  saveKYCData,
};
