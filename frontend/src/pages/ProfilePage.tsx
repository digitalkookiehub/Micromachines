import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiSave, FiPackage, FiFileText, FiGrid, FiImage, FiX, FiCamera, FiBriefcase } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { GradientButton } from '@/components/ui/GradientButton';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [companyName, setCompanyName] = useState(user?.company_name ?? '');
  const [logoUrl, setLogoUrl] = useState(user?.logo_url ?? '');
  const [logoPreview, setLogoPreview] = useState(user?.logo_url ?? '');
  const [saving, setSaving] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setLogoUrl(dataUrl);
      setLogoPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoUrl('');
    setLogoPreview('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authService.updateProfile({
        full_name: fullName,
        phone: phone || undefined,
        company_name: companyName || undefined,
        logo_url: logoUrl || undefined,
      });
      await refreshUser();
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const isDealer = user.role === 'dealer';
  const dp = user.dealer_profile;

  const quickLinks = [
    { to: '/orders', icon: FiPackage, label: 'My Orders' },
    { to: '/invoices', icon: FiFileText, label: 'Invoices' },
    { to: '/dashboard', icon: FiGrid, label: 'Dashboard' },
  ];

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-6">My Profile</h1>

        <div className="space-y-6">
          {/* Business Info (Admin/Distributor) */}
          {isAdmin && (
            <GlassCard>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiBriefcase className="text-accent-600" size={20} /> Business / Distributor Info
              </h2>

              {/* Logo Upload */}
              <div className="flex items-start gap-6 mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <FiImage className="text-gray-400" size={32} />
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-accent-600 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-accent-700 shadow-md">
                    <FiCamera size={14} />
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                  {logoPreview && (
                    <motion.button whileTap={{ scale: 0.9 }} onClick={removeLogo}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow">
                      <FiX size={12} />
                    </motion.button>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 mb-1">Company Logo</p>
                  <p className="text-xs text-gray-400 mb-3">Upload your business logo. It will appear on invoices and the header.</p>
                  <AnimatedInput
                    label="Company / Distributor Name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. MicroMachines Pvt Ltd"
                  />
                </div>
              </div>
            </GlassCard>
          )}

          {/* Personal Info */}
          <GlassCard>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center">
                {user.logo_url ? (
                  <img src={user.logo_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <FiUser className="text-accent-600" size={28} />
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{user.full_name}</h2>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <FiMail size={14} /> {user.email}
                </p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold bg-accent-100 text-accent-700 capitalize">
                  {user.role}
                </span>
                {user.company_name && (
                  <span className="inline-block mt-1 ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-gold-100 text-gold-700">
                    {user.company_name}
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AnimatedInput
                  label="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
                <AnimatedInput
                  label="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <FiMail size={14} />
                <span>{user.email} (cannot be changed)</span>
              </div>
              <GradientButton type="submit" disabled={saving}>
                <span className="flex items-center gap-2">
                  <FiSave size={16} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </span>
              </GradientButton>
            </form>
          </GlassCard>

          {/* Dealer Profile */}
          {isDealer && dp && (
            <GlassCard>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Dealer Profile</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Company</span>
                  <p className="font-medium text-gray-900">{dp.company_name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Dealer ID</span>
                  <p className="font-medium text-gray-900">{dp.dealer_id}</p>
                </div>
                <div>
                  <span className="text-gray-500">GST Number</span>
                  <p className="font-medium text-gray-900">{dp.gst_number || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Tier</span>
                  <p className="font-medium text-gray-900 capitalize">{dp.tier}</p>
                </div>
                <div>
                  <span className="text-gray-500">Approval Status</span>
                  <p className={`font-medium ${dp.is_approved ? 'text-green-600' : 'text-yellow-600'}`}>
                    {dp.is_approved ? 'Approved' : 'Pending Approval'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Credit Limit</span>
                  <p className="font-medium text-gray-900">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(dp.credit_limit)}</p>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Quick Links */}
          <GlassCard>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Links</h2>
            <div className="grid grid-cols-3 gap-3">
              {quickLinks.map((link) => (
                <Link key={link.to} to={link.to}>
                  <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                    className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-accent-50 transition-colors">
                    <link.icon className="text-accent-600" size={22} />
                    <span className="text-sm font-medium text-gray-700">{link.label}</span>
                  </motion.div>
                </Link>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </PageWrapper>
  );
}
