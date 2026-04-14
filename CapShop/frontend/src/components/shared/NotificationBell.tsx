import React, { useState, useEffect, useRef } from "react";
import { Bell, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import apiClient from "../../api/axiosClient";

type Notification = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAtUtc: string;
  emailStatus: string;
  emailFailureReason?: string;
};

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get("/notifications");
      if (res.data?.data) {
        setNotifications(res.data.data);
      }
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Simple polling every 30 seconds for new order notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.post(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {}
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[340px] bg-white border border-gray-100 shadow-xl rounded-xl z-50 overflow-hidden transform animate-in slide-in-from-top-2">
          <div className="p-3 border-b flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-800">Notifications</h3>
            <span className="text-xs font-semibold text-gray-500">{unreadCount} unread</span>
          </div>
          
          <div className="max-h-[350px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">
                You have no notifications right now.
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {notifications.map(n => (
                  <li 
                    key={n.id} 
                    className={`p-4 transition-colors cursor-default ${n.isRead ? 'bg-white opacity-70' : 'bg-green-50/30'}`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className={`text-[13px] font-bold ${n.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                          {n.title}
                        </h4>
                        <p className="text-[12px] text-gray-600 mt-1 leading-relaxed">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-2 font-medium uppercase tracking-wider flex items-center gap-2">
                          {new Date(n.createdAtUtc).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })}
                          
                          {/* Email Status for Admin Troubleshooting */}
                          {n.emailStatus && (
                            <span className={`inline-flex items-center gap-1 normal-case font-bold px-1.5 py-0.5 rounded ${
                              n.emailStatus === 'Sent' ? 'bg-blue-50 text-blue-600' : 
                              n.emailStatus === 'Failed' ? 'bg-red-50 text-red-600' : 
                              'bg-gray-50 text-gray-600'
                            }`} title={n.emailFailureReason || 'Email Status'}>
                              {n.emailStatus === 'Sent' ? <CheckCircle2 size={10} /> : 
                               n.emailStatus === 'Failed' ? <AlertCircle size={10} /> : <Mail size={10} />}
                              Email {n.emailStatus}
                            </span>
                          )}
                        </p>
                      </div>
                      {!n.isRead && (
                        <button 
                          onClick={(e) => markAsRead(n.id, e)}
                          className="w-2 h-2 shrink-0 rounded-full bg-blue-500 ring-4 ring-blue-50 hover:bg-blue-600 transition-colors"
                          title="Mark as read"
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};