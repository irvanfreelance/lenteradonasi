'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function AutoCarousel({ campaigns }: { campaigns: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const intervalId = setInterval(() => {
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      
      // If we've reached the end
      if (container.scrollLeft >= maxScrollLeft - 10) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        // Scroll by roughly one item's standard width + CSS gap
        const itemWidth = container.clientWidth * 0.82 + 12; 
        container.scrollBy({ left: itemWidth, behavior: 'smooth' });
      }
    }, 3500);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div 
      ref={scrollRef}
      className="flex overflow-x-auto snap-x snap-mandatory gap-3 pl-5 pr-5 pb-3 pt-1 no-scrollbar scroll-smooth" 
      style={{ minHeight: '196px' }}
    >
      {campaigns.map((camp: any) => (
        <Link
          key={camp.id}
          href={`/kampanye/${camp.slug}`}
          className="snap-start shrink-0 cursor-pointer active:scale-[0.98] transition-transform block rounded-2xl overflow-hidden shadow-lg relative"
          style={{ width: '82%', minWidth: '82%', height: '180px' }}
        >
          <div className="relative w-full h-full">
            <Image 
              src={camp.image_url || '/placeholder.jpg'} 
              alt={camp.title} 
              fill 
              sizes="(max-width: 768px) 88vw, 400px" 
              className="object-cover" 
              priority 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-5">
              <p className="text-teal-300 text-[11px] font-bold mb-1.5 uppercase tracking-wider">{camp.category_name}</p>
              <h2 className="text-white font-extrabold text-lg leading-tight w-full line-clamp-2 drop-shadow-md">{camp.title}</h2>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
