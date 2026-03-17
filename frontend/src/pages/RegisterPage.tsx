import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { MeshBackground } from '@/components/layout/MeshBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { GradientButton } from '@/components/ui/GradientButton';
import { authService } from '@/services/authService';
import type { UserRole } from '@/types';
import toast from 'react-hot-toast';

export function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '', full_name: '', phone: '', role: 'customer' as UserRole, company_name: '', gst_number: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDealer = formData.role === 'dealer';
  const update = (f: string, v: string) => setFormData((p) => ({ ...p, [f]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await authService.register(formData);
      toast.success(isDealer ? 'Dealer account created! Awaiting admin approval.' : 'Account created! Please login.');
      navigate('/');
    } catch { toast.error('Registration failed. Email may already be in use.'); }
    finally { setIsSubmitting(false); }
  };

  return (
    <PageWrapper>
      <MeshBackground />
      <div className="max-w-md mx-auto px-4 py-12">
        <GlassCard hover={false} className="!bg-white/90">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Create Account</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatedInput label="Full Name" value={formData.full_name} onChange={(e) => update('full_name', e.target.value)} required />
            <AnimatedInput label="Email" type="email" value={formData.email} onChange={(e) => update('email', e.target.value)} required />
            <AnimatedInput label="Password" type="password" value={formData.password} onChange={(e) => update('password', e.target.value)} required />
            <AnimatedInput label="Phone (optional)" value={formData.phone} onChange={(e) => update('phone', e.target.value)} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
              <div className="flex gap-3">
                {(['customer', 'dealer'] as const).map((role) => (
                  <button key={role} type="button" onClick={() => update('role', role)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${formData.role === role ? (role === 'dealer' ? 'border-dealer-500 bg-dealer-50 text-dealer-700' : 'border-primary-500 bg-primary-50 text-primary-700') : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    {role === 'customer' ? 'Customer' : 'Dealer / Business'}
                  </button>
                ))}
              </div>
            </div>
            {isDealer && (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <AnimatedInput label="Company Name" value={formData.company_name} onChange={(e) => update('company_name', e.target.value)} required={isDealer} />
                <AnimatedInput label="GST Number (optional)" value={formData.gst_number} onChange={(e) => update('gst_number', e.target.value)} placeholder="e.g., 27XXXXX1234X1Z5" />
                <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg">Dealer accounts require admin approval before accessing dealer pricing.</p>
              </div>
            )}
            <GradientButton type="submit" disabled={isSubmitting} variant={isDealer ? 'dealer' : 'primary'} className="w-full">
              {isSubmitting ? 'Creating...' : isDealer ? 'Apply as Dealer' : 'Create Account'}
            </GradientButton>
          </form>
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
