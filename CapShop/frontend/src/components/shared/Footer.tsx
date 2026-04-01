export const Footer = () => (
  <footer className="mt-10 border-t border-[var(--border-soft)] bg-[color:var(--surface)]/90 backdrop-blur">
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <span className="font-display text-lg font-extrabold tracking-tight text-[color:var(--primary-strong)]">CAPSHOP</span>
          <p className="text-[color:var(--text-soft)] text-sm mt-1">Fast delivery • Easy returns • Secure payments</p>
        </div>
        <div className="flex gap-5 text-sm text-[color:var(--text-soft)] font-medium">
          <span className="hover:text-[color:var(--primary)] cursor-pointer transition-colors">Support</span>
          <span className="hover:text-[color:var(--primary)] cursor-pointer transition-colors">FAQ</span>
          <span className="hover:text-[color:var(--primary)] cursor-pointer transition-colors">Privacy</span>
          <span className="hover:text-[color:var(--primary)] cursor-pointer transition-colors">Terms</span>
        </div>
      </div>
      <div className="border-t border-[var(--border-soft)] mt-5 pt-4 text-center text-[color:var(--text-soft)] text-xs">
        © 2026 CapShop. All rights reserved.
      </div>
    </div>
  </footer>
);