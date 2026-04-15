import { useEffect, useState } from "react";
import { Search, Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { getAdminProducts, createProduct, updateProduct, deleteProduct,
         setProductActive, type AdminProductDto } from "../../../api/adminApi";
import { getCategories, type CategoryDto } from "../../../api/catalogApi";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { Loader } from "../../../components/shared/Loader";
import toast from "react-hot-toast";

interface ProductForm {
  name: string; description: string; price: string;
  stockQuantity: string; categoryId: string; imageUrl: string; isActive: boolean;
}

const EMPTY_FORM: ProductForm = {
  name: "", description: "", price: "", stockQuantity: "",
  categoryId: "", imageUrl: "", isActive: true,
};

export const AdminProductsPage = () => {
  const [products,    setProducts]    = useState<AdminProductDto[]>([]);
  const [categories,  setCategories]  = useState<CategoryDto[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [fetchError,  setFetchError]  = useState<string | null>(null);
  const [search,      setSearch]      = useState("");
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [showModal,   setShowModal]   = useState(false);
  const [editId,      setEditId]      = useState<string | null>(null);
  const [form,        setForm]        = useState<ProductForm>(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await getAdminProducts(search || undefined, page, 10);
      setProducts(res.items);
      setTotalPages(res.totalPages);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? "Failed to load products.";
      setFetchError(msg);
      toast.error(msg);
    } finally { setLoading(false); }
  };

  useEffect(() => { getCategories().then(setCategories); }, []);
  useEffect(() => { fetchProducts(); }, [search, page]);

  const openCreate = () => { setEditId(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit   = (p: AdminProductDto) => {
    setEditId(p.id);
    setForm({
      name: p.name, description: p.description,
      price: String(p.price), stockQuantity: String(p.stockQuantity),
      categoryId: String(p.categoryId), imageUrl: p.imageUrl ?? "", isActive: p.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.categoryId) {
      toast.error("Name, price and category are required."); return;
    }
    setSaving(true);
    try {
      if (editId) {
        await updateProduct(editId, {
          name: form.name, description: form.description,
          price: Number(form.price), categoryId: Number(form.categoryId),
          imageUrl: form.imageUrl || undefined,
        });
        toast.success("Product updated!");
      } else {
        await createProduct({
          name: form.name, description: form.description,
          price: Number(form.price), stockQuantity: Number(form.stockQuantity),
          categoryId: Number(form.categoryId),
          imageUrl: form.imageUrl || undefined, isActive: form.isActive,
        });
        toast.success("Product created!");
      }
      setShowModal(false);
      fetchProducts();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to save product.");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
      setProducts(current => current.filter(product => product.id !== id));
      toast.success("Product deleted.");
      fetchProducts();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Could not delete.");
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await setProductActive(id, !current);
      if (current) {
        setProducts(items => items.filter(product => product.id !== id));
      } else {
        setProducts(items =>
          items.map(product =>
            product.id === id ? { ...product, isActive: true } : product,
          ),
        );
      }
      toast.success(`Product ${!current ? "activated" : "deactivated"}.`);
      fetchProducts();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Could not update status.");
    }
  };

  return (
    <div className="space-y-5">

      {/* ── Actions Bar (Wf09) ───────────────────────────────────── */}
      <div className="card p-4 flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h3 className="font-bold text-primary text-sm">Actions</h3>
          <p className="text-xs text-gray-500">Add Product • Import CSV • Upload Images</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search products..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-9 text-sm py-2 w-56" />
          </div>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm py-2">
            <Plus size={14} /> Add Product
          </button>
        </div>
      </div>

      {/* ── Product List Table (Wf09) ─────────────────────────────── */}
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <span className="col-span-1">Product#</span>
          <span className="col-span-4">Name</span>
          <span className="col-span-2 text-right">Price</span>
          <span className="col-span-1 text-right">Stock</span>
          <span className="col-span-2 text-center">Status</span>
          <span className="col-span-2 text-right">Action</span>
        </div>

        {loading ? <div className="p-8"><Loader /></div> :
         fetchError ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-danger text-sm font-medium">{fetchError}</p>
            <button onClick={fetchProducts} className="btn-primary text-xs py-1.5 px-3">Retry</button>
          </div>
         ) : products.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No products found.</div>
        ) : products.map(p => (
          <div key={p.id}
            className="grid grid-cols-12 gap-2 px-5 py-3.5 border-b border-gray-100 items-center hover:bg-gray-50 transition-colors">

            <div className="col-span-1 text-xs font-mono text-gray-400">{p.id.slice(0, 4)}</div>

            <div className="col-span-4">
              <p className="font-medium text-gray-800 text-sm line-clamp-1">{p.name}</p>
              <p className="text-xs text-gray-400">{p.categoryName}</p>
            </div>

            <div className="col-span-2 text-right font-bold text-primary text-sm">
              ₹{p.price.toLocaleString("en-IN")}
            </div>

            <div className="col-span-1 text-right text-sm text-gray-600">{p.stockQuantity}</div>

            <div className="col-span-2 flex justify-center">
              <StatusBadge status={p.stockStatus} />
            </div>

            <div className="col-span-2 flex justify-end gap-2">
              <button onClick={() => handleToggleActive(p.id, p.isActive)}
                className={`p-1.5 rounded-lg transition-colors ${p.isActive ? "text-success hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
                title={p.isActive ? "Deactivate" : "Activate"}>
                {p.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              </button>
              <button onClick={() => openEdit(p)}
                className="p-1.5 text-primary hover:bg-blue-50 rounded-lg transition-colors">
                <Edit2 size={14} />
              </button>
              <button onClick={() => handleDelete(p.id)}
                className="p-1.5 text-danger hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1 px-3 text-sm">Prev</button>
            <span className="text-sm text-gray-500 py-1">{page}/{totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1 px-3 text-sm">Next</button>
          </div>
        )}
      </div>

      {/* ── Add/Edit Modal ────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-display font-bold text-primary">
                {editId ? "Edit Product" : "Add New Product"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Product Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input-field" placeholder="e.g. Samsung Galaxy S24" />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="input-field resize-none" rows={3} placeholder="Product description..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Price (₹) *</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="input-field" placeholder="499" min="0.01" step="0.01" />
                </div>
                {!editId && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Stock Qty *</label>
                    <input type="number" value={form.stockQuantity} onChange={e => setForm(f => ({ ...f, stockQuantity: e.target.value }))}
                      className="input-field" placeholder="50" min="0" />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Category *</label>
                <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                  className="input-field">
                  <option value="">Select category...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Image URL</label>
                <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                  className="input-field" placeholder="https://..." />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="accent-primary" />
                <span className="text-sm font-medium text-gray-700">Active (visible in catalog)</span>
              </label>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? "Saving…" : editId ? "Update Product" : "Create Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
