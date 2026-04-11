import { useEffect, useState } from "react";
import { Package, Calendar, Clock, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { getMyOrders, getOrderById, cancelOrder, type OrderSummaryDto, type OrderDto } from "../../../api/orderApi";
import { Loader } from "../../../components/shared/Loader";
import { showToast } from "../../../components/shared/Toast";

const statusColors: Record<string, string> = {
  "PaymentPending": "bg-amber-100 text-amber-800",
  "Packed": "bg-indigo-100 text-indigo-800",
  "Paid": "bg-blue-100 text-blue-800",
  "Shipped": "bg-purple-100 text-purple-800",
  "Delivered": "bg-green-100 text-green-800",
  "Cancelled": "bg-red-100 text-red-800",
};

export const OrderHistoryPage = () => {
  const [orders, setOrders] = useState<OrderSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailsCache, setDetailsCache] = useState<Record<string, OrderDto>>({});
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    getMyOrders(1, 100)
      .then(res => setOrders(res.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = async (orderId: string) => {
    if (expandedId === orderId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(orderId);
    
    // Fetch details if not in cache
    if (!detailsCache[orderId]) {
      setLoadingDetails(true);
      try {
        const detail = await getOrderById(orderId);
        setDetailsCache(prev => ({ ...prev, [orderId]: detail }));
      } catch (err) {
        console.error("Failed to load order details", err);
      } finally {
        setLoadingDetails(false);
      }
    }
  };

  const onCancelOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      await cancelOrder(orderId, "Cancelled by user");
      showToast.success("Order cancelled successfully");
      
      // Refetch orders list and the expanded detailed order
      const res = await getMyOrders(1, 100);
      setOrders(res.items);
      const updatedDetail = await getOrderById(orderId);
      setDetailsCache(prev => ({ ...prev, [orderId]: updatedDetail }));
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Failed to cancel order";
      showToast.error(msg);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8 animate-in fade-in duration-500">
      <h1 className="text-3xl font-display font-bold text-[#111] mb-2">Order History</h1>
      <p className="text-gray-500 font-medium mb-8">View and track all your recent orders</p>

      {loading ? (
        <div className="flex justify-center p-12"><Loader /></div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm flex flex-col items-center">
          <Package size={64} className="text-gray-200 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No orders yet</h2>
          <p className="text-gray-500 max-w-sm">Looks like you haven't made your first purchase yet. Start shopping to see your orders here!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const isExpanded = expandedId === order.id;
            const details = detailsCache[order.id];
            
            return (
              <div key={order.id} className={`bg-white border transition-all duration-300 overflow-hidden ${isExpanded ? "border-[#0c9ca4] rounded-2xl shadow-md" : "border-gray-200 rounded-xl hover:border-gray-300"}`}>
                
                {/* Header Row */}
                <div 
                  className={`p-5 flex flex-wrap gap-4 items-center justify-between cursor-pointer select-none transition-colors ${isExpanded ? "bg-[#f0f9ff]/50" : "hover:bg-gray-50"}`}
                  onClick={() => toggleExpand(order.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-[#f0f4f9] w-12 h-12 rounded-full flex items-center justify-center shrink-0">
                      <Package size={24} className="text-[#0c9ca4]" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{order.orderNumber}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1 font-medium">
                        <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(order.placedAt).toLocaleDateString()}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{order.itemCount} Items</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-gray-500 font-medium">Total Amount</p>
                      <p className="font-extrabold text-gray-900 text-lg">₹{order.totalAmount.toLocaleString("en-IN")}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${statusColors[order.status] || "bg-gray-100 text-gray-800 border-gray-200"}`}>
                      {order.status}
                    </div>
                    <div className="text-gray-400">
                      {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-6 bg-white animate-in slide-in-from-top-4 duration-300">
                    {loadingDetails && !details ? (
                      <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#0c9ca4]" size={32} /></div>
                    ) : details ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2">
                          <h4 className="font-bold text-gray-800 mb-4 uppercase tracking-wider text-xs">Items in Order</h4>
                          <div className="space-y-4">
                            {details.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <div>
                                  <p className="font-bold text-gray-900 text-sm line-clamp-1">{item.productName}</p>
                                  <p className="text-xs text-gray-500 font-medium mt-1">₹{item.unitPrice.toLocaleString("en-IN")} × {item.quantity}</p>
                                </div>
                                <span className="font-extrabold text-gray-800">
                                  ₹{item.lineTotal.toLocaleString("en-IN")}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="mb-6">
                            <h4 className="font-bold text-gray-800 mb-2 uppercase tracking-wider text-xs">Shipping Address</h4>
                            <div className="bg-[#f8fafc] p-4 rounded-xl border border-[#e2e8f0] text-sm text-gray-600 font-medium leading-relaxed">
                              <p className="font-bold text-gray-900 mb-1">{details.shippingAddress.fullName}</p>
                              <p>{details.shippingAddress.addressLine}</p>
                              <p>{details.shippingAddress.city}, {details.shippingAddress.state} {details.shippingAddress.pincode}</p>
                              <p className="mt-2 text-gray-500 flex items-center gap-1"><Clock size={12}/> {details.shippingAddress.phoneNumber}</p>
                            </div>
                          </div>
                          
                          <div>
                             <h4 className="font-bold text-gray-800 mb-2 uppercase tracking-wider text-xs">Order Summary</h4>
                             <div className="bg-gray-900 text-white p-4 rounded-xl">
                               <div className="flex justify-between text-sm opacity-80 mb-2">
                                 <span>Subtotal</span>
                                 <span>₹{details.totalAmount.toLocaleString("en-IN")}</span>
                               </div>
                               <div className="flex justify-between text-sm opacity-80 mb-3 pb-3 border-b border-white/10">
                                 <span>Shipping</span>
                                 <span className="text-green-400">Free</span>
                               </div>
                               <div className="flex justify-between font-extrabold text-lg">
                                 <span>Total</span>
                                 <span>₹{details.totalAmount.toLocaleString("en-IN")}</span>
                               </div>
                               {details.transactionId && (
                                  <div className="mt-4 pt-3 border-t border-white/10 text-xs opacity-60 font-mono">
                                    TXN: {details.transactionId}
                                  </div>
                               )}
                             </div>
                             
                             {/* Cancel Button */}
                             {["Paid", "PaymentPending", "Packed"].includes(details.status) && (
                               <button
                                 onClick={() => onCancelOrder(details.id)}
                                 className="w-full mt-4 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white border border-red-200 hover:border-red-500 py-3 rounded-xl font-bold text-sm transition-all shadow-sm"
                               >
                                 Cancel Order
                               </button>
                             )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-red-500 text-center">Failed to load details.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
