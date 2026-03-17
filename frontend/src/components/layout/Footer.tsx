import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

export function Footer() {
  return (
    <footer className="mt-auto">
      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="w-full bg-brand-600 hover:bg-brand-700 text-white text-sm py-3 transition-colors font-semibold">Back to top</button>
      <div className="bg-gradient-to-b from-brand-900 to-glow-900 text-brand-200">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-bold text-white text-sm mb-3">Categories</h4>
            <div className="space-y-2 text-xs">{['Mouse', 'Keyboards', 'Monitors', 'Headsets', 'Storage', 'Accessories'].map((c) => (
              <Link key={c} to={`/?category=${c.toLowerCase()}`} className="block hover:text-white transition-colors">{c}</Link>
            ))}</div>
          </div>
          <div>
            <h4 className="font-bold text-white text-sm mb-3">Account</h4>
            <div className="space-y-2 text-xs">
              <Link to="/profile" className="block hover:text-white">Profile</Link>
              <Link to="/orders" className="block hover:text-white">Orders</Link>
              <Link to="/invoices" className="block hover:text-white">Invoices</Link>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-white text-sm mb-3">For Dealers</h4>
            <div className="space-y-2 text-xs">
              <Link to="/register" className="block hover:text-white">Register</Link>
              <p className="hover:text-white cursor-pointer">Benefits</p>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-white text-sm mb-3">Contact</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2"><FiMail size={12} /> info@micromachines.in</div>
              <div className="flex items-center gap-2"><FiPhone size={12} /> +91 98765 43210</div>
              <div className="flex items-center gap-2"><FiMapPin size={12} /> Mumbai, India</div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-glow-950 text-glow-400/50 py-4 text-center text-[10px]">&copy; {new Date().getFullYear()} Micro Machines. All rights reserved.</div>
    </footer>
  );
}
