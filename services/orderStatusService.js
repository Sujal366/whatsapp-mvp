import hubspotService from "../services/hubspotService.js";
import supabase from "../supabaseClient.js";

/**
 * Update order status and sync with CRM
 */
export async function updateOrderStatus(
  orderId,
  newStatus,
  customerPhone = null
) {
  try {
    console.log(`🔄 Updating order ${orderId} status to: ${newStatus}`);

    // Update order status in database
    const { data: order, error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      console.error("❌ Failed to update order status:", error.message);
      return { success: false, error: error.message };
    }

    // Map order status to HubSpot deal stages
    const statusMap = {
      pending: "qualifiedtoprospect",
      confirmed: "presentationscheduled",
      preparing: "decisionmakerboughtin",
      shipped: "contractsent",
      delivered: "closedwon",
      cancelled: "closedlost",
    };

    const hubspotStage = statusMap[newStatus] || "qualifiedtoprospect";

    // Update deal in HubSpot if configured
    if (hubspotService.isConfigured() && customerPhone) {
      try {
        // Find the contact first
        const contact = await hubspotService.findContactByPhone(customerPhone);

        if (contact) {
          // In a real scenario, you'd need to find the specific deal
          // For now, we'll log that the status update would happen
          console.log(`📈 Would update HubSpot deal stage to: ${hubspotStage}`);

          // TODO: Implement deal finding by custom order ID
          // await hubspotService.updateDealStage(dealId, hubspotStage);
        }
      } catch (crmError) {
        console.error("⚠️ CRM status update error:", crmError.message);
      }
    }

    console.log(`✅ Order ${orderId} status updated to: ${newStatus}`);
    return { success: true, order };
  } catch (error) {
    console.error("💥 Order status update error:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Add a status update endpoint for orders
 */
export async function handleStatusUpdate(req, res) {
  try {
    const { orderId } = req.params;
    const { status, customerPhone } = req.body;

    const validStatuses = [
      "pending",
      "confirmed",
      "preparing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Valid statuses: ${validStatuses.join(", ")}`,
      });
    }

    const result = await updateOrderStatus(orderId, status, customerPhone);

    if (result.success) {
      res.json({
        success: true,
        message: `Order ${orderId} status updated to ${status}`,
        order: result.order,
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error("💥 Status update endpoint error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}
