import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUploadCloud, FiPlus, FiTrash2, FiZap, FiImage, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { formatCurrency } from '@/lib/utils';
import api from '@/services/api';
import type { ProductCategory } from '@/types';

const categories: ProductCategory[] = ['mouse', 'keyboard', 'monitor', 'headset', 'storage', 'accessories'];

interface AiResult {
  description?: string;
  features?: string[];
  specifications?: Record<string, string>;
  suggested_category?: string;
  suggested_hsn_code?: string;
}

export function AIProductUploadPage() {
  const navigate = useNavigate();

  // Step 1: Basic info
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [generating, setGenerating] = useState(false);
  const [aiDone, setAiDone] = useState(false);

  // Step 2: AI-generated + editable fields
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>([]);
  const [category, setCategory] = useState<ProductCategory>('accessories');
  const [hsnCode, setHsnCode] = useState('');

  // Step 3: Pricing
  const [customerPrice, setCustomerPrice] = useState('');
  const [dealerPrice, setDealerPrice] = useState('');
  const [sku, setSku] = useState('');
  const [stockQuantity, setStockQuantity] = useState('0');
  const [publishing, setPublishing] = useState(false);

  // AI status
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    api.get('/products/ai/status').then(r => setAiAvailable(r.data.running && r.data.has_default)).catch(() => setAiAvailable(false));
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith('image/')) { setFile(f); setPreview(URL.createObjectURL(f)); }
  };

  const removeImage = () => { setFile(null); setPreview(''); };

  const handleGenerate = async () => {
    if (!productName.trim()) { toast.error('Enter a product name first'); return; }
    setGenerating(true);
    try {
      const { data } = await api.post('/products/ai/generate-description', null, {
        params: { product_name: productName, brand, category: '' },
      });
      if (data.success) {
        const result = data.data as AiResult;
        setDescription(result.description || '');
        setFeatures(result.features || []);
        if (result.specifications) {
          setSpecs(Object.entries(result.specifications).map(([key, value]) => ({ key, value: String(value) })));
        }
        if (result.suggested_category && categories.includes(result.suggested_category as ProductCategory)) {
          setCategory(result.suggested_category as ProductCategory);
        }
        if (result.suggested_hsn_code) setHsnCode(result.suggested_hsn_code);
        setAiDone(true);
        toast.success('AI generated product details!');
      } else {
        toast.error(data.error || 'AI generation failed');
      }
    } catch {
      toast.error('Failed to connect to AI service');
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!productName || !sku || !hsnCode || !customerPrice || !dealerPrice) {
      toast.error('Fill all required fields (name, SKU, HSN, prices)');
      return;
    }

    setPublishing(true);
    try {
      // Use uploaded file or generate placeholder
      let imageUrl: string | null = null;
      if (file) {
        // Convert file to base64 data URL for local storage
        const reader = new FileReader();
        imageUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      } else {
        const label = encodeURIComponent(brand ? `${brand} ${productName}`.slice(0, 25) : productName.slice(0, 25));
        imageUrl = `https://placehold.co/400x400/2563eb/white?text=${label}`;
      }

      const specObj: Record<string, string> = {};
      specs.forEach(s => { if (s.key) specObj[s.key] = s.value; });

      const fullDescription = features.length > 0
        ? `${description}\n\nKey Features:\n${features.map(f => `• ${f}`).join('\n')}`
        : description;

      const { data } = await api.post('/products', {
        name: productName,
        brand: brand || 'Unknown',
        sku,
        hsn_code: hsnCode,
        category,
        description: fullDescription,
        specifications: specObj,
        customer_price: parseFloat(customerPrice),
        dealer_price: parseFloat(dealerPrice),
        stock_quantity: parseInt(stockQuantity) || 0,
        image_url: imageUrl,
      });
      toast.success('Product created successfully!');
      navigate(`/products/${data.slug}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error.response?.data?.detail || 'Failed to create product');
    } finally {
      setPublishing(false);
    }
  };

  const margin = customerPrice && dealerPrice ? parseFloat(customerPrice) - parseFloat(dealerPrice) : 0;
  const marginPercent = customerPrice && parseFloat(customerPrice) > 0 ? ((margin / parseFloat(customerPrice)) * 100).toFixed(1) : '0';

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Add New Product</h1>
        <p className="text-gray-500 mb-8 text-sm">Enter product name, upload a photo, and let AI fill in the details</p>

        <div className="space-y-6">
          {/* Section 1: Product Name + Photo */}
          <GlassCard>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Info</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Name & Brand */}
              <div className="space-y-4">
                <AnimatedInput
                  label="Product Name *"
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  placeholder="e.g. Logitech G502 HERO Gaming Mouse"
                />
                <AnimatedInput
                  label="Brand"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  placeholder="e.g. Logitech"
                />
                {aiAvailable && (
                  <GradientButton
                    variant="dealer"
                    onClick={handleGenerate}
                    disabled={generating || !productName.trim()}
                    className="w-full"
                  >
                    {generating ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        AI Generating...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <FiZap size={16} /> Auto-fill with AI
                      </span>
                    )}
                  </GradientButton>
                )}
                {aiAvailable === false && (
                  <p className="text-xs text-gray-400">AI auto-fill unavailable (Ollama not running)</p>
                )}
              </div>

              {/* Right: Photo Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Product Photo</label>
                {preview ? (
                  <div className="relative">
                    <img src={preview} alt="Product" className="w-full h-56 object-contain bg-gray-50 rounded-xl border-2 border-gray-200 p-2" />
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600"
                    >
                      <FiX size={14} />
                    </motion.button>
                    <p className="text-xs text-gray-400 mt-1 truncate">{file?.name}</p>
                  </div>
                ) : (
                  <div
                    onDrop={handleDrop}
                    onDragOver={e => e.preventDefault()}
                    onClick={() => document.getElementById('photo-input')?.click()}
                    className="h-56 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
                  >
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                      <FiImage className="text-gray-400" size={24} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600">Drop image here or click to upload</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  </div>
                )}
                <input id="photo-input" type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              </div>
            </div>
          </GlassCard>

          {/* Section 2: Description & Details (shown after AI or manually fillable) */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Product Details</h2>
              {aiDone && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">AI Generated</span>}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Product description..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as ProductCategory)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 outline-none"
                  >
                    {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <AnimatedInput label="HSN Code *" value={hsnCode} onChange={e => setHsnCode(e.target.value)} placeholder="e.g. 84716060" />
              </div>

              {/* Features */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Key Features</label>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setFeatures([...features, ''])}
                    className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"><FiPlus size={14} /> Add</motion.button>
                </div>
                {features.length === 0 && <p className="text-xs text-gray-400">No features added yet</p>}
                <div className="space-y-2">
                  {features.map((f, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={f} onChange={e => { const n = [...features]; n[i] = e.target.value; setFeatures(n); }}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary-500 outline-none" placeholder={`Feature ${i + 1}`} />
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setFeatures(features.filter((_, j) => j !== i))}
                        className="text-red-400 hover:text-red-600 p-1"><FiTrash2 size={14} /></motion.button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Specifications */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Specifications</label>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSpecs([...specs, { key: '', value: '' }])}
                    className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"><FiPlus size={14} /> Add</motion.button>
                </div>
                {specs.length === 0 && <p className="text-xs text-gray-400">No specifications added yet</p>}
                <div className="space-y-2">
                  {specs.map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={s.key} onChange={e => { const n = [...specs]; n[i].key = e.target.value; setSpecs(n); }}
                        placeholder="Key (e.g. DPI)" className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary-500 outline-none" />
                      <input value={s.value} onChange={e => { const n = [...specs]; n[i].value = e.target.value; setSpecs(n); }}
                        placeholder="Value (e.g. 25600)" className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary-500 outline-none" />
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSpecs(specs.filter((_, j) => j !== i))}
                        className="text-red-400 hover:text-red-600 p-1"><FiTrash2 size={14} /></motion.button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Section 3: SKU, Stock & Pricing */}
          <GlassCard>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Inventory</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <AnimatedInput label="SKU *" value={sku} onChange={e => setSku(e.target.value)} placeholder="e.g. LOG-G502-H" />
              <AnimatedInput label="Stock Quantity" type="number" value={stockQuantity} onChange={e => setStockQuantity(e.target.value)} placeholder="0" />
              <div /> {/* spacer */}
            </div>

            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h3 className="font-medium text-gray-700 mb-4">Margin Calculator</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <AnimatedInput label="Customer Price (MRP) *" type="number" value={customerPrice} onChange={e => setCustomerPrice(e.target.value)} placeholder="0.00" />
                <AnimatedInput label="Dealer Price *" type="number" value={dealerPrice} onChange={e => setDealerPrice(e.target.value)} placeholder="0.00" />
              </div>
              {customerPrice && dealerPrice && (
                <div className="border-t border-gray-200 pt-4 flex justify-between text-sm">
                  <span className="text-gray-500">Margin</span>
                  <span className={`font-bold ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(margin)} ({marginPercent}%)
                  </span>
                </div>
              )}
            </div>

            <GradientButton onClick={handlePublish} disabled={publishing} size="lg" className="w-full">
              {publishing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Publishing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <FiUploadCloud size={18} /> Publish Product
                </span>
              )}
            </GradientButton>
          </GlassCard>
        </div>
      </div>
    </PageWrapper>
  );
}
