'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppShareButtonProps {
  text: string;
  className?: string;
  showText?: boolean;
}

export default function WhatsAppShareButton({ 
  text, 
  className = '',
  showText = true 
}: WhatsAppShareButtonProps) {
  const handleShare = () => {
    const encodedText = encodeURIComponent(text);
    // Use api.whatsapp.com for best cross-platform compatibility
    const waUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleShare}
      className={`flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:border-[#25D366] hover:text-[#25D366] hover:bg-[#25D366]/5 rounded-lg text-xs font-bold transition-all shadow-sm ${className}`}
      title="Bagikan ke WhatsApp"
    >
      <MessageCircle className="w-3.5 h-3.5" />
      {showText && <span>Share WA</span>}
    </button>
  );
}
