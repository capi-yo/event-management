import React from 'react';
import { cn } from '@/lib/utils';

interface PriceDisplayProps {
  price: number | string | null | undefined;
  discountType?: 'none' | 'percentage' | 'fixed' | string | null;
  discountValue?: number | string | null | undefined;
  currency?: 'ETB' | 'USD' | string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function PriceDisplay({
  price,
  discountType = 'none',
  discountValue = 0,
  currency = 'ETB',
  className,
  size = 'md',
}: PriceDisplayProps) {
  // Validate and parse base price
  const basePrice = typeof price === 'string' ? parseFloat(price) : (price || 0);
  const type = discountType || 'none';
  const value = typeof discountValue === 'string' ? parseFloat(discountValue) : (discountValue || 0);

  // Handle invalid/negative base price (treat as Free)
  if (isNaN(basePrice) || basePrice <= 0) {
    const heightClass = size === 'sm' ? 'min-h-[2.5rem]' : size === 'md' ? 'min-h-[3.5rem]' : 'min-h-[4.5rem]';
    return (
      <div className={cn("flex flex-col justify-center", heightClass, className)}>
        <span className={cn(
          "font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider",
          size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
        )}>
          Free
        </span>
      </div>
    );
  }

  // Calculate discounted price and percentage
  let discountedPrice = basePrice;
  let percentOff = 0;
  let hasDiscount = false;

  if (type === 'percentage' && value > 0 && value <= 100) {
    discountedPrice = basePrice * (1 - value / 100);
    percentOff = Math.round(value);
    hasDiscount = percentOff > 0;
  } else if (type === 'fixed' && value > 0) {
    discountedPrice = Math.max(0, basePrice - value);
    percentOff = basePrice > 0 ? Math.round((value / basePrice) * 100) : 0;
    hasDiscount = discountedPrice < basePrice;
  }

  // Round prices to 2 decimals
  const finalOriginal = Math.round(basePrice * 100) / 100;
  const finalDiscounted = Math.round(discountedPrice * 100) / 100;

  // Currency formatter helper
  const format = (amt: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: amt % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amt);
  };

  // Font size classes
  const sizeClasses = {
    sm: {
      original: "text-xs",
      discounted: "text-sm",
      badge: "text-[9px] px-2 py-0.5 mt-0.5",
      container: "min-h-[2.5rem]",
      regularText: "text-sm",
    },
    md: {
      original: "text-sm",
      discounted: "text-base",
      badge: "text-[10px] px-2.5 py-0.5 mt-0.5",
      container: "min-h-[3.5rem]",
      regularText: "text-lg",
    },
    lg: {
      original: "text-base",
      discounted: "text-xl",
      badge: "text-xs px-3 py-1 mt-1",
      container: "min-h-[4.5rem]",
      regularText: "text-2xl",
    },
  };

  const activeSize = sizeClasses[size] || sizeClasses.md;

  if (!hasDiscount || finalDiscounted >= finalOriginal) {
    return (
      <div className={cn("flex flex-col justify-center", activeSize.container, className)}>
        <span className={cn("font-black text-zinc-900 dark:text-white", activeSize.regularText)}>
          {format(finalOriginal)}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col justify-center items-start", activeSize.container, className)}>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={cn("text-zinc-400 line-through font-medium", activeSize.original)}>
          {format(finalOriginal)}
        </span>
        <span className="text-zinc-400 text-xs">→</span>
        <span className={cn("text-crimson dark:text-red-500 font-black", activeSize.discounted)}>
          {format(finalDiscounted)}
        </span>
      </div>
      <span className={cn("bg-crimson text-white font-extrabold uppercase rounded-full tracking-wider inline-block", activeSize.badge)}>
        {percentOff}% OFF
      </span>
    </div>
  );
}
