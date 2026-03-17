import { motion } from 'framer-motion';

interface CategoryTabsProps {
  activeCategory: string;
  onSelect: (category: string) => void;
}

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'mouse', label: 'Mouse' },
  { value: 'keyboard', label: 'Keyboard' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'headset', label: 'Headset' },
  { value: 'storage', label: 'Storage' },
  { value: 'accessories', label: 'Accessories' },
];

export function CategoryTabs({ activeCategory, onSelect }: CategoryTabsProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {CATEGORIES.map((cat) => (
        <motion.button
          key={cat.value}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(cat.value)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeCategory === cat.value
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {cat.label}
        </motion.button>
      ))}
    </div>
  );
}
