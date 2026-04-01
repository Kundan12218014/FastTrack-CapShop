import { useState } from "react";
import { X } from "lucide-react";
import type { CategoryDto } from "../../../api/catalogApi";
import type { AdminProductDto, CreateProductRequest, UpdateProductRequest } from "../../../types/admin.types";
import { createProduct, updateProduct } from "../../../api/adminApi";
import { showToast } from "../../../components/shared/Toast";

interface Props {
  isOpen:     boolean;
  onClose:    () => void;
  onSuccess:  () => void;
  categories: CategoryDto[];
  editProduct?: AdminProductDto | null;
}

interface FormState {
  name: string; description: string; price: string;
  stockQuantity: string; categoryId: string; imageUrl: string; isActive: boolean;
}

const EMPTY: FormState = {
  name: "", description: "", price: "", stockQuantity: "0",
  categoryId: "", imageUrl: "", isActive: true,
};

export const ProductFormModal = ({
  isOpen, onClose, onSuccess, categories, editProduct,
}: Props) => {
  const [form,   setForm]   = useState<FormState>(() => editProduct ? {
    name:          editProduct.name,
    description:   editProduct.description,
    price:         String(editProduct.price),
    stockQuantity: String(editProduct.stockQuantity),
    categoryId:    String(editProduct.categoryId),
    imageUrl:      editProduct.imageUrl ?? "",
    isActive:      editProduct.isActive,
  } : EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm(f => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.price || !form.categoryId) {
      showToast.error("Name, price and category are required.");
      return;
    }
    if (Number(form.price) <= 0) {
      showToast.error("Price must be greater than zero.");
      return;
    }

    setSaving(true);
    try {
      if (editProduct) {
        const dto: UpdateProductRequest = {
          name:        form.name,
          description: form.description,
          price:       Number(form.price),
          categoryId:  Number(form.categoryId),
          imageUrl:    form.imageUrl || undefined,
        };
        await updateProduct(editProduct.id, dto);
        showToast.success("Product updated successfully!");
      } else {
        const dto: CreateProductRequest = {
          name:          form.name,
          description:   form.description,
          price:         Number(form.price),
          stockQuantity: Number(form.stockQuantity),
          categoryId:    Number(form.categoryId),
          imageUrl:      form.imageUrl || undefined,
          isActive:      form.isActive,
        };
        await createProduct(dto);
        showToast.success("Product created successfully!");
      }
      onSuccess();
      onClose();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
        ?? "Failed to save product.";
      showToast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">

        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-display font-bold text-primary">
            {editProduct ? "Edit Product" : "Add New Product"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Product Name *</label>
            <input value={form.name} onChange={e => set("name", e.target.value)}
              className="input-field" placeholder="e.g. Samsung Galaxy S24" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              className="input-field resize-none" rows={3}
              placeholder="Product description..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Price (₹) *</label>
              <input type="number" value={form.price} min="0.01" step="0.01"
                onChange={e => set("price", e.target.value)}
                className="input-field" placeholder="499" />
            </div>
            {!editProduct && (
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Stock Qty</label>
                <input type="number" value={form.stockQuantity} min="0"
                  onChange={e => set("stockQuantity", e.target.value)}
                  className="input-field" placeholder="50" />
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Category *</label>
            <select value={form.categoryId} onChange={e => set("categoryId", e.target.value)}
              className="input-field">
              <option value="">Select category...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Image URL</label>
            <input value={form.imageUrl} onChange={e => set("imageUrl", e.target.value)}
              className="input-field" placeholder="https://example.com/image.jpg" />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive}
              onChange={e => set("isActive", e.target.checked)}
              className="accent-primary w-4 h-4" />
            <span className="text-sm font-medium text-gray-700">
              Active (visible in catalog)
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? "Saving…" : editProduct ? "Update Product" : "Create Product"}
          </button>
        </div>
      </div>
    </div>
  );
};