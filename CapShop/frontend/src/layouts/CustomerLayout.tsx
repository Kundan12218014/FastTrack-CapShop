import { Outlet } from "react-router-dom";
import { Navbar } from "../components/shared/Navbar";
import { Footer } from "../components/shared/Footer";
import { ChatWidget } from "../features/chat";

export const CustomerLayout = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
    {/* AI chatbot — available on all customer pages */}
    <ChatWidget />
  </div>
);