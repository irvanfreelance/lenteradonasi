'use client';

import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import ShareModal from './ShareModal';

interface ShareButtonProps {
  url: string;
  title: string;
  className?: string;
}

export default function ShareButton({ url, title, className }: ShareButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className={cn("p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors", className)}
      >
        <Share2 size={22} />
      </button>

      <ShareModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        url={url} 
        title={title} 
      />
    </>
  );
}
