'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function AutoCarousel({ campaigns }: { campaigns: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Clone campaigns to create an infinite loop effect
  const items = [...campaigns, ...campaigns, ...campaigns];
  const originalLength = campaigns.length;

  const getScrollPos = useCallback((container: HTMLDivElement, index: number) => {
    const itemWidth = container.clientWidth * 0.82 + 12;
    // Calculate scroll position to center the item at the given index
    return (itemWidth * index) - (container.clientWidth - itemWidth) / 2 + 6; // +6 for half gap adjustment
  }, []);

  // Initialize scroll position to the middle set
  useEffect(() => {
    const initScroll = () => {
      const container = scrollRef.current;
      if (container && originalLength > 0 && container.clientWidth > 0) {
        container.scrollLeft = getScrollPos(container, originalLength);
        setIsInitialized(true);
      } else if (container && originalLength > 0) {
        setTimeout(initScroll, 100);
      }
    };

    initScroll();
  }, [originalLength, getScrollPos]);

  const handleInfiniteScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container || !isInitialized || originalLength === 0 || isDragging) return;

    const itemWidth = container.clientWidth * 0.82 + 12;
    const totalWidth = itemWidth * originalLength;

    // Reset when we move too far into the 1st or 3rd set
    if (container.scrollLeft >= totalWidth * 2) {
      container.scrollLeft -= totalWidth;
    } else if (container.scrollLeft <= totalWidth * 0.5) {
      container.scrollLeft += totalWidth;
    }
  }, [originalLength, isInitialized, isDragging]);

  useEffect(() => {
    if (isPaused || isDragging || originalLength === 0 || !isInitialized) return;

    const intervalId = setInterval(() => {
      const container = scrollRef.current;
      if (!container) return;

      const itemWidth = container.clientWidth * 0.82 + 12;
      container.scrollBy({ left: itemWidth, behavior: 'smooth' });
    }, 4500);

    return () => clearInterval(intervalId);
  }, [isPaused, isDragging, originalLength, isInitialized]);

  // Dragging logic
  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
    setIsPaused(true);
  };

  const onMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setIsPaused(false);
    
    const container = scrollRef.current;
    if (container) {
      const itemWidth = container.clientWidth * 0.82 + 12;
      // Find the nearest item and center it
      const nearestItem = Math.round((container.scrollLeft + (container.clientWidth - itemWidth) / 2 - 6) / itemWidth);
      container.scrollTo({ left: getScrollPos(container, nearestItem), behavior: 'smooth' });
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1.5; 
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  // Touch logic for mobile
  const onTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
    setIsPaused(true);
  };

  const onTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setIsPaused(false);
    const container = scrollRef.current;
    if (container) {
      const itemWidth = container.clientWidth * 0.82 + 12;
      const nearestItem = Math.round((container.scrollLeft + (container.clientWidth - itemWidth) / 2 - 6) / itemWidth);
      container.scrollTo({ left: getScrollPos(container, nearestItem), behavior: 'smooth' });
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1.5;
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  if (campaigns.length === 0) return null;

  return (
    <div 
      className="relative w-full overflow-hidden"
      style={{ minHeight: '210px' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div 
        ref={scrollRef}
        className={`flex overflow-x-auto gap-3 pb-6 pt-2 no-scrollbar ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ scrollBehavior: 'auto', WebkitOverflowScrolling: 'touch' }}
        onScroll={handleInfiniteScroll}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onMouseMove={onMouseMove}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchMove={onTouchMove}
      >
        {items.map((camp: any, idx: number) => (
          <Link
            key={`carousel-item-${camp.id}-${idx}`}
            href={`/kampanye/${camp.slug}`}
            className={`snap-center shrink-0 cursor-pointer active:scale-[0.98] transition-all duration-300 block rounded-2xl overflow-hidden shadow-xl relative ${!isInitialized ? 'opacity-0' : 'opacity-100'}`}
            style={{ width: '82%', minWidth: '82%', height: '180px' }}
            onClick={(e) => isDragging && e.preventDefault()}
          >
            <div className="relative w-full h-full pointer-events-none">
              <Image 
                src={camp.image_url || '/placeholder.jpg'} 
                alt={camp.title} 
                fill 
                sizes="(max-width: 768px) 88vw, 400px" 
                className="object-cover" 
                priority={idx >= originalLength && idx < originalLength * 2} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-5">
                <p className="text-teal-300 text-[11px] font-bold mb-1.5 uppercase tracking-wider">{camp.category_name}</p>
                <h2 className="text-white font-extrabold text-lg leading-tight w-full line-clamp-2 drop-shadow-lg">{camp.title}</h2>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
