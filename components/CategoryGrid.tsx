import React from 'react';
import Link from 'next/link';
import { 
  Banknote, Gift, Stethoscope, Building2, GraduationCap, 
  CloudLightning, Home, Wallet, Beef, Coins, Heart, 
  Landmark, HandHeart, BookOpen, Baby, Tent, Droplets,
  TreePine, Utensils, Moon, Star
} from 'lucide-react';

// Map icon_name from database to lucide components
const iconMap: Record<string, React.ComponentType<any>> = {
  // Exact matches from DB
  Banknote, Gift, Stethoscope, Building2, GraduationCap,
  CloudLightning, Home, Wallet, Beef, Coins, Heart,
  Landmark, HandHeart, BookOpen, Baby, Tent, Droplets,
  TreePine, Utensils, Moon, Star,
};

// Category name to icon + color mapping (fallback when icon_name doesn't match)
const categoryStyleMap: Record<string, { icon: React.ComponentType<any>; color: string; bg: string }> = {
  'Zakat':         { icon: Banknote,       color: 'text-emerald-600', bg: 'bg-emerald-50' },
  'Qurban':        { icon: Gift,           color: 'text-orange-500',  bg: 'bg-orange-50' },
  'Medis':         { icon: Stethoscope,    color: 'text-rose-500',    bg: 'bg-rose-50' },
  'Panti Asuhan':  { icon: Building2,      color: 'text-indigo-600',  bg: 'bg-indigo-50' },
  'Pendidikan':    { icon: GraduationCap,  color: 'text-blue-600',    bg: 'bg-blue-50' },
  'Bencana':       { icon: CloudLightning, color: 'text-amber-600',   bg: 'bg-amber-50' },
  'Infaq':         { icon: HandHeart,      color: 'text-teal-600',    bg: 'bg-teal-50' },
  'Pembangunan':   { icon: Landmark,       color: 'text-slate-600',   bg: 'bg-slate-100' },
  'Kemanusiaan':   { icon: Heart,          color: 'text-pink-500',    bg: 'bg-pink-50' },
  'Lingkungan':    { icon: TreePine,       color: 'text-green-600',   bg: 'bg-green-50' },
};

export default function CategoryGrid({ categories }: { categories: any[] }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {categories.map((cat, i) => {
        // Try DB icon_name first, then category name mapping, then fallback
        const style = categoryStyleMap[cat.name];
        const IconComponent = iconMap[cat.icon_name] || style?.icon || Heart;
        const iconColor = style?.color || 'text-teal-600';
        const iconBg = style?.bg || 'bg-gray-50';

        return (
          <Link key={i} href={`/?q=${cat.name}`} className="flex flex-col items-center cursor-pointer active:scale-95 group">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-2 shadow-sm border border-gray-50 ${iconBg}`}>
              <IconComponent size={26} className={iconColor} />
            </div>
            <span className="text-[10px] font-semibold text-center text-gray-600">{cat.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
