import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, ChevronRight, ChevronLeft } from "lucide-react";
import { getCart, simulatePayment, placeOrder, type CartDto } from "../../../api/orderApi";
import { buildRoute, ROUTES } from "../../../constants/routes";
import toast from "react-hot-toast";

const steps = ["Address", "Delivery", "Payment", "Review"];

const addressSchema = z.object({
  fullName:    z.string().min(2, "Full name required"),
  addressLine: z.string().min(5, "Address required"),
  city:        z.string().min(2, "City required"),
  state:       z.string().min(2, "State required"),
  pincode:     z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
  phoneNumber: z.string().regex(/^\d{10}$/, "Phone must be 10 digits"),
});
type AddressForm = z.infer<typeof addressSchema>;

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const [step,          setStep]          = useState(0);
  const [cart,          setCart]          = useState<CartDto | null>(null);
  const [address,       setAddress]       = useState<AddressForm | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState("Standard");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [payResult,     setPayResult]     = useState<{ isSuccess: boolean; transactionId: string } | null>(null);
  const [placing,       setPlacing]       = useState(false);
  const [paying,        setPaying]        = useState(false);

  useEffect(() => {
    getCart().then(c => {
      if (!c.items.length) { navigate(ROUTES.CUSTOMER.CART); return; }
      setCart(c);
    });
  }, []);

  const gst       = cart ? Math.round(cart.total * 0.18) : 0;
  const delivery  = cart && cart.total > 499 ? 0 : 49;
  const grandTotal = cart ? cart.total + gst + delivery : 0;

  const { register, handleSubmit, formState: { errors } } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: address ?? undefined,
  });

  const handleAddressSubmit = (data: AddressForm) => {
    setAddress(data);
    setStep(1);
  };

  const handleSimulatePayment = async () => {
    setPaying(true);
    try {
      const res = await simulatePayment(paymentMethod);
      setPayResult(res);
      if (res.isSuccess) {
        toast.success("Payment successful!");
        setStep(3);
      } else {
        toast.error(res.failureReason ?? "Payment failed. Try again.");
      }
    } finally {
      setPaying(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!address || !payResult?.isSuccess) return;
    setPlacing(true);
    try {
      const order = await placeOrder({
        shippingAddress: address,
        paymentMethod,
        transactionId:   payResult.transactionId,
      });
      toast.success("Order placed successfully!");
      navigate(buildRoute(ROUTES.CUSTOMER.ORDER_CONFIRM, { id: order.id.toString() }));
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Could not place order.");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* ── Stepper Header (Wf06) ─────────────────────────────────── */}
      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all
                  ${i < step  ? "bg-success text-white"
                  : i === step ? "bg-primary text-white ring-4 ring-primary/20"
                  :              "bg-gray-100 text-gray-400"}`}>
                  {i < step ? <Check size={16} /> : i + 1}
                </div>
                <span className={`text-xs font-medium mt-1 ${i === step ? "text-primary" : "text-gray-400"}`}>
                  {s}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 transition-colors
                  ${i < step ? "bg-success" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Step Content (Wf06) ───────────────────────────────────── */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="font-display text-lg font-bold text-primary mb-5">
            {step === 0 && "Delivery Address"}
            {step === 1 && "Delivery Method"}
            {step === 2 && "Payment"}
            {step === 3 && "Review & Confirm"}
          </h2>

          {/* Step 1: Address */}
          {step === 0 && (
            <form onSubmit={handleSubmit(handleAddressSubmit)} className="space-y-4">
              <p className="text-sm text-gray-500">Address fields + validations</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Full Name</label>
                  <input {...register("fullName")} placeholder="Jane Doe" className={`input-field ${errors.fullName ? "input-error" : ""}`} />
                  {errors.fullName && <p className="text-xs text-danger mt-1">{errors.fullName.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Phone</label>
                  <input {...register("phoneNumber")} placeholder="9876543210" className={`input-field ${errors.phoneNumber ? "input-error" : ""}`} maxLength={10} />
                  {errors.phoneNumber && <p className="text-xs text-danger mt-1">{errors.phoneNumber.message}</p>}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Address Line</label>
                <input {...register("addressLine")} placeholder="House No, Street, Area" className={`input-field ${errors.addressLine ? "input-error" : ""}`} />
                {errors.addressLine && <p className="text-xs text-danger mt-1">{errors.addressLine.message}</p>}
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">City</label>
                  <input {...register("city")} placeholder="Bangalore" className={`input-field ${errors.city ? "input-error" : ""}`} />
                  {errors.city && <p className="text-xs text-danger mt-1">{errors.city.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">State</label>
                  <input {...register("state")} placeholder="Karnataka" className={`input-field ${errors.state ? "input-error" : ""}`} />
                  {errors.state && <p className="text-xs text-danger mt-1">{errors.state.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Pincode</label>
                  <input {...register("pincode")} placeholder="560001" maxLength={6} className={`input-field ${errors.pincode ? "input-error" : ""}`} />
                  {errors.pincode && <p className="text-xs text-danger mt-1">{errors.pincode.message}</p>}
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" className="btn-primary flex items-center gap-2">
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Delivery */}
          {step === 1 && (
            <div className="space-y-4">
              {[
                { value: "Standard", label: "Standard Delivery", desc: "5–7 business days", price: "FREE" },
                { value: "Express",  label: "Express Delivery",  desc: "2–3 business days", price: "₹99" },
                { value: "Instant",  label: "Instant Delivery",  desc: "Same day delivery", price: "₹199" },
              ].map(opt => (
                <label key={opt.value}
                  className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all
                    ${deliveryMethod === opt.value ? "border-primary bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="delivery" value={opt.value}
                      checked={deliveryMethod === opt.value}
                      onChange={() => setDeliveryMethod(opt.value)}
                      className="accent-primary" />
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </div>
                  </div>
                  <span className={`font-bold text-sm ${opt.price === "FREE" ? "text-success" : "text-primary"}`}>
                    {opt.price}
                  </span>
                </label>
              ))}
              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(0)} className="btn-secondary flex items-center gap-2">
                  <ChevronLeft size={16} /> Back
                </button>
                <button onClick={() => setStep(2)} className="btn-primary flex items-center gap-2">
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 2 && (
            <div className="space-y-4">
              {[
                { value: "UPI",  label: "UPI",             icon: "📲" },
                { value: "Card", label: "Credit/Debit Card", icon: "💳" },
                { value: "COD",  label: "Cash on Delivery", icon: "💵" },
              ].map(opt => (
                <label key={opt.value}
                  className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all
                    ${paymentMethod === opt.value ? "border-primary bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <input type="radio" name="payment" value={opt.value}
                    checked={paymentMethod === opt.value}
                    onChange={() => setPaymentMethod(opt.value)}
                    className="accent-primary" />
                  <span className="text-xl">{opt.icon}</span>
                  <span className="font-semibold text-sm text-gray-800">{opt.label}</span>
                </label>
              ))}

              {payResult && (
                <div className={`p-3 rounded-lg text-sm font-medium
                  ${payResult.isSuccess ? "bg-green-50 text-success" : "bg-red-50 text-danger"}`}>
                  {payResult.isSuccess
                    ? `✓ Payment successful — Txn: ${payResult.transactionId}`
                    : "✗ Payment failed. Please try again."}
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(1)} className="btn-secondary flex items-center gap-2">
                  <ChevronLeft size={16} /> Back
                </button>
                <button
                  onClick={handleSimulatePayment}
                  disabled={paying}
                  className="btn-accent flex items-center gap-2"
                >
                  {paying ? "Processing…" : "Pay & Simulate"}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 3 && address && (
            <div className="space-y-5">
              {/* Address summary */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Shipping to</p>
                <p className="font-medium text-gray-800">{address.fullName}</p>
                <p className="text-sm text-gray-600">{address.addressLine}</p>
                <p className="text-sm text-gray-600">
                  {address.city}, {address.state} — {address.pincode}
                </p>
                <p className="text-sm text-gray-600">{address.phoneNumber}</p>
              </div>

              {/* Items summary */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Items</p>
                {cart?.items.map(item => (
                  <div key={item.id} className="flex justify-between py-1.5 text-sm border-b border-gray-100">
                    <span className="text-gray-700">{item.productName} × {item.quantity}</span>
                    <span className="font-medium text-primary">₹{item.lineTotal.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(2)} className="btn-secondary flex items-center gap-2">
                  <ChevronLeft size={16} /> Back
                </button>
                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="btn-secondary">Save</button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={placing || !payResult?.isSuccess}
                    className="btn-accent flex items-center gap-2"
                  >
                    {placing ? "Placing…" : "Pay & Place Order"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Order Summary Sidebar (Wf06) ─────────────────────────── */}
        <div className="card p-5 h-fit">
          <h3 className="font-bold text-primary mb-4">Order Summary</h3>
          <div className="space-y-2 text-sm">
            {cart?.items.map(item => (
              <div key={item.id} className="flex justify-between text-gray-600">
                <span className="line-clamp-1">{item.productName} ×{item.quantity}</span>
                <span>₹{item.lineTotal.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>GST (18%)</span>
              <span>₹{gst.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery</span>
              <span>{delivery === 0 ? "FREE" : `₹${delivery}`}</span>
            </div>
            <div className="flex justify-between font-bold text-primary border-t border-gray-200 pt-2">
              <span>Total</span>
              <span>₹{grandTotal.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};