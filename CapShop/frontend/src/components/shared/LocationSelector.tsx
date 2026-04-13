import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, Crosshair, Home, Edit2, Trash2, X, Plus } from "lucide-react";
import apiClient from "../../api/axiosClient";

type Address = {
  id: string;
  title: string;
  detail: string;
};

export const LocationSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDetail, setEditDetail] = useState("");

  const fetchAddresses = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/auth/addresses');
      if (res.data?.data) setAddresses(res.data.data);
    } catch (e) {
      console.error("Failed to load addresses from backend");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      fetchAddresses();
    } else {
      // Fallback or handle unauthenticated state if needed
      const saved = localStorage.getItem("userAddresses");
      if (saved) setAddresses(JSON.parse(saved));
    }
  }, [fetchAddresses]);

  // Persist to local if not auth, otherwise rely on backend fetch
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      localStorage.setItem("userAddresses", JSON.stringify(addresses));
    }
  }, [addresses]);

  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    if (addresses.length && !selectedId) {
      setSelectedId(addresses[0].id);
    }
  }, [addresses, selectedId]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const toggleModal = () => {
    setIsOpen(!isOpen);
    setEditingId(null);
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setIsOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      if (localStorage.getItem("token")) {
        await apiClient.delete(`/auth/addresses/${id}`);
      }
      const next = addresses.filter(a => a.id !== id);
      setAddresses(next);
      if (selectedId === id) setSelectedId(next[0]?.id || "");
    } catch (e) {
      console.error("Failed to delete address");
    }
  };

  const startEdit = (address: Address) => {
    setEditingId(address.id);
    setEditTitle(address.title);
    setEditDetail(address.detail);
  };

  const startAdd = () => {
    setEditingId("new");
    setEditTitle("");
    setEditDetail("");
  };

  const saveEdit = async () => {
    if (!editTitle.trim() || !editDetail.trim()) return;

    try {
      if (editingId === "new") {
        let newAddr: Address;

        if (localStorage.getItem("token")) {
          const res = await apiClient.post("/auth/addresses", { title: editTitle, detail: editDetail });
          newAddr = res.data.data;
        } else {
          newAddr = {
            id: Math.random().toString(36).substr(2, 9),
            title: editTitle,
            detail: editDetail
          };
        }

        setAddresses([newAddr, ...addresses]);
        setSelectedId(newAddr.id);
      } else {
        if (localStorage.getItem("token")) {
          await apiClient.put(`/auth/addresses/${editingId}`, { title: editTitle, detail: editDetail });
        }
        setAddresses(addresses.map(a =>
          a.id === editingId ? { ...a, title: editTitle, detail: editDetail } : a
        ));
      }
      setEditingId(null);
    } catch (e) {
      console.error("Failed to save address");
    }
  };

  const [isLocating, setIsLocating] = useState(false);

  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          // Use OpenStreetMap Nominatim API for free reverse geocoding
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );

          if (!res.ok) throw new Error("Failed to fetch address");

          const data = await res.json();
          const detectedAddress = data.display_name || `Lat: ${latitude}, Lng: ${longitude}`;

          const newAddrData = {
            title: "Current Location",
            detail: detectedAddress,
          };

          let savedAddr: Address;
          if (localStorage.getItem("token")) {
            const res = await apiClient.post("/auth/addresses", newAddrData);
            savedAddr = res.data.data;
          } else {
            savedAddr = { id: Math.random().toString(36).substr(2, 9), ...newAddrData };
          }

          setAddresses((prev) => [savedAddr, ...prev]);
          setSelectedId(savedAddr.id);
          setIsOpen(false);
        } catch (error) {
          console.error("Geocoding error:", error);
          alert("Failed to decode your location. Please enter manually.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert(`Unable to get your location: ${error.message}`);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };


  const selectedAddressObj = addresses.find(a => a.id === selectedId);
  const displayAddress = selectedAddressObj
    ? (selectedAddressObj.detail.length > 35 ? selectedAddressObj.detail.substring(0, 32) + "..." : selectedAddressObj.detail)
    : "Select Location";

  if (!isOpen) {
    return (
      <div
        onClick={toggleModal}
        className="hidden md:flex flex-col shrink-0 cursor-pointer group px-2"
      >
        <div className="text-[15px] font-extrabold text-[color:var(--text)] flex items-center gap-1 group-hover:text-[color:var(--primary)] transition-colors">
          Delivery Location <ChevronDown size={14} className="mt-0.5 opacity-70 group-hover:opacity-100" />
        </div>
        <div className="text-[13px] font-medium text-[color:var(--text-soft)] truncate max-w-[200px]">
          {displayAddress}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:flex flex-col shrink-0 cursor-pointer group px-2 relative z-[101]">
        <div className="text-[15px] font-extrabold text-[color:var(--primary)] flex items-center gap-1 transition-colors">
          Delivery Location <ChevronDown size={14} className="mt-0.5 opacity-100 rotate-180 transition-transform" />
        </div>
        <div className="text-[13px] font-medium text-[color:var(--text-soft)] truncate max-w-[200px]">
          {displayAddress}
        </div>
      </div>

      {/* Full Screen Overlay Modal via Portal to escape Navbar's backdrop-filter containing block */}
      {createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            ref={modalRef}
            className="bg-[color:var(--surface)] w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col mx-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[color:var(--border-soft)] shrink-0">
              <h2 className="text-xl font-heading font-extrabold text-[color:var(--text)]">Change Location</h2>
              <button onClick={() => setIsOpen(false)} className="text-[color:var(--text-soft)] hover:text-[color:var(--text)] transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 bg-[#f8f9fa] dark:bg-[color:var(--bg-elevated)] flex-1 overflow-y-auto">
              {/* Action Row */}
              {editingId === null && (
                <div className="flex flex-col sm:flex-row bg-white dark:bg-[color:var(--surface)] p-2 rounded-xl shadow-sm border border-[color:var(--border-soft)] mb-8 gap-2 sm:gap-0">
                  <button
                    onClick={handleDetectLocation}
                    disabled={isLocating}
                    className="flex-1 bg-[#1aa34a] hover:bg-[#16883e] disabled:opacity-75 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Crosshair size={18} className={isLocating ? "animate-spin" : ""} />
                    {isLocating ? "Detecting..." : "Detect my location"}
                  </button>
                  <div className="flex items-center justify-center px-4 font-bold text-gray-300 hidden sm:flex">
                    OR
                  </div>
                  <div className="flex-[1.5] relative group">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="search delivery location e.g., 'Pune'"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter' && searchQuery.trim()) {
                          e.preventDefault();
                          try {
                            const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`);
                            if (!res.ok) throw new Error("Search failed");
                            const data = await res.json();

                            if (data && data.length > 0) {
                              setEditDetail(data[0].display_name);
                              setEditTitle(searchQuery);
                            } else {
                              setEditDetail(searchQuery);
                              setEditTitle("Searched Location");
                            }
                          } catch (err) {
                            setEditDetail(searchQuery);
                            setEditTitle("Searched Location");
                          }
                          setEditingId("new");
                          setSearchQuery("");
                        }
                      }}
                      className="w-full h-full min-h-[48px] pl-10 pr-4 rounded-lg border-2 border-transparent focus:border-[color:var(--primary)]/30 focus:outline-none bg-gray-50/50 dark:bg-[color:var(--bg-elevated)] text-[15px] font-medium"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] sm:hidden group-focus-within:hidden text-gray-400 font-bold">
                      ENTER TO SEARCH
                    </div>
                  </div>
                </div>
              )}

              {/* Editing Form */}
              {editingId !== null && (
                <div className="bg-white dark:bg-[color:var(--surface)] p-5 rounded-xl border border-[color:var(--primary)] mb-6 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <h3 className="font-bold text-[color:var(--text)] mb-4">{editingId === "new" ? "Add New Address" : "Edit Address"}</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[color:var(--text-soft)] mb-1">Address Title (e.g. Home, Work)</label>
                      <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-[color:var(--border-soft)] focus:border-[color:var(--primary)] outline-none bg-[color:var(--bg-elevated)]" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[color:var(--text-soft)] mb-1">Full Address Details</label>
                      <textarea value={editDetail} onChange={e => setEditDetail(e.target.value)} className="w-full p-3 rounded-lg border border-[color:var(--border-soft)] focus:border-[color:var(--primary)] outline-none min-h-[80px] resize-none bg-[color:var(--bg-elevated)]" />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button onClick={() => setEditingId(null)} className="px-4 py-2 rounded-lg font-bold text-[color:var(--text-soft)] hover:bg-[color:var(--surface-muted)] transition-colors">Cancel</button>
                      <button onClick={saveEdit} className="px-4 py-2 rounded-lg font-bold bg-[color:var(--primary)] text-white hover:opacity-90 transition-opacity">Save Address</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Saved Addresses Section */}
              {editingId === null && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-[color:var(--text-soft)] uppercase tracking-wider">Your saved addresses</h3>
                    <button onClick={startAdd} className="text-[color:var(--primary)] hover:underline text-sm font-bold flex items-center gap-1">
                      <Plus size={16} /> Add New
                    </button>
                  </div>

                  <div className="space-y-3">
                    {addresses.length === 0 && (
                      <div className="text-center p-6 text-[color:var(--text-soft)] text-sm font-medium border-2 border-dashed border-[color:var(--border-soft)] rounded-xl">
                        No saved addresses yet.
                      </div>
                    )}

                    {addresses.map(address => (
                      <div
                        key={address.id}
                        className={`bg-white dark:bg-[color:var(--surface)] rounded-xl border-2 p-4 flex gap-4 transition-all group ${selectedId === address.id ? "border-[color:var(--primary)] bg-[color:var(--primary)]/5" : "border-[color:var(--border-soft)] hover:border-[color:var(--primary)]/50 cursor-pointer"}`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-500 flex items-center justify-center shrink-0" onClick={() => handleSelect(address.id)}>
                          <Home size={20} />
                        </div>
                        <div className="flex-1" onClick={() => handleSelect(address.id)}>
                          <div className="flex justify-between items-start">
                            <h4 className="font-extrabold text-[16px] text-[color:var(--text)] mb-1">
                              {address.title} {selectedId === address.id && <span className="text-[10px] ml-2 font-bold bg-[color:var(--primary)]/20 text-[color:var(--primary)] px-2 py-0.5 rounded-full align-top">Selected</span>}
                            </h4>
                          </div>
                          <p className="text-[13px] font-medium text-[color:var(--text-soft)] leading-snug whitespace-pre-wrap">
                            {address.detail}
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-end sm:items-start gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); startEdit(address); }}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[color:var(--text-soft)] hover:text-green-600 hover:bg-green-50 transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(address.id); }}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[color:var(--text-soft)] hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
