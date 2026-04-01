import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildRoute, ROUTES } from "../../../constants/routes";
import { simulatePayment, placeOrder } from "../../../api/orderApi";
import type {
  ShippingAddressDto,
  PaymentSimulationResult,
} from "../../../types/order.types";
import { showToast } from "../../../components/shared/Toast";

export const useCheckout = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [address, setAddress] = useState<ShippingAddressDto | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState("Standard");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [payResult, setPayResult] = useState<PaymentSimulationResult | null>(
    null,
  );
  const [paying, setPaying] = useState(false);
  const [placing, setPlacing] = useState(false);

  const goNext = () => setStep((s) => Math.min(s + 1, 3));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleAddressSubmit = (data: ShippingAddressDto) => {
    setAddress(data);
    goNext();
  };

  const handleSimulatePayment = async () => {
    setPaying(true);
    try {
      const result = await simulatePayment(paymentMethod);
      setPayResult(result);
      if (result.isSuccess) {
        showToast.success("Payment successful!");
        goNext();
      } else {
        showToast.error(
          result.failureReason ?? "Payment failed. Please try again.",
        );
      }
    } catch {
      showToast.error("Payment simulation failed.");
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
        transactionId: payResult.transactionId,
      });
      showToast.success("Order placed successfully!");
      navigate(
        buildRoute(ROUTES.CUSTOMER.ORDER_CONFIRM, { id: order.id.toString() }),
      );
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Could not place order.";
      showToast.error(msg);
    } finally {
      setPlacing(false);
    }
  };

  return {
    step,
    address,
    deliveryMethod,
    paymentMethod,
    payResult,
    paying,
    placing,
    setDeliveryMethod,
    setPaymentMethod,
    handleAddressSubmit,
    handleSimulatePayment,
    handlePlaceOrder,
    goNext,
    goBack,
  };
};
