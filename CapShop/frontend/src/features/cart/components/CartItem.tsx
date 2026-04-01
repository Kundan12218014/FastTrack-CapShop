import { Trash2 } from "lucide-react";
import type { CartItemDto } from "../../../types/cart.types";
import { formatCurrency } from "../../../utils/formatUtils";

interface Props {
  item:          CartItemDto;
  onQtyChange:   (itemId: number, qty: number) => void;
  onRemove:      (itemId: number) => void;
}

export const CartItem = ({ item, onQtyChange, onRemove }: Props) => (
  <div className="grid grid-cols-12 gap-2 px-5 py-4 border-b border-gray-100 items-center hover:bg-gray-50 transition-colors">

    {/* Item name */}
    <div className="col-span-5">
      <p className="font-medium text-gray-800 text-sm line-clamp-2">{item.productName}</p>
      <p className="text-xs text-gray-400 mt-0.5 font-mono">#{item.productId}</p>
    </div>

    {/* Unit price */}
    <div className="col-span-2 text-right text-sm font-medium text-gray-700">
      {formatCurrency(item.unitPrice)}
    </div>

    {/* Qty stepper */}
    <div className="col-span-2 flex items-center justify-center">
      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden text-sm">
        <button
          onClick={() => onQtyChange(item.id, item.quantity - 1)}
          disabled={item.quantity <= 1}
          className="px-2 py-1.5 bg-gray-50 hover:bg-gray-100 font-bold text-gray-600
                     disabled:opacity-40 transition-colors"
        >−</button>
        <span className="px-3 py-1.5 font-semibold min-w-[32px] text-center">
          {item.quantity}
        </span>
        <button
          onClick={() => onQtyChange(item.id, item.quantity + 1)}
          className="px-2 py-1.5 bg-gray-50 hover:bg-gray-100 font-bold text-gray-600 transition-colors"
        >+</button>
      </div>
    </div>

    {/* Line total */}
    <div className="col-span-2 text-right text-sm font-bold text-primary">
      {formatCurrency(item.lineTotal)}
    </div>

    {/* Remove */}
    <div className="col-span-1 flex justify-end">
      <button
        onClick={() => onRemove(item.id)}
        className="p-1.5 text-danger hover:bg-red-50 rounded-lg transition-colors"
        aria-label="Remove item"
      >
        <Trash2 size={14} />
      </button>
    </div>
  </div>
);