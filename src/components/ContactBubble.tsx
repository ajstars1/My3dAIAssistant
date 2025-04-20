'use client';
import React from 'react';
import { Mail, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const ContactBubble = () => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end">
      {/* Email Button - Larger Size */}
      <Button
        variant="secondary"
        size="icon"
        className="rounded-full h-14 w-14 shadow-xl bg-blue-600/80 hover:bg-blue-700/90 text-white backdrop-blur-sm transition-all duration-300 ease-in-out hover:scale-105"
        asChild
      >
        <a href="mailto:ayush@0unveiled.com" aria-label="Email Ayush">
          <Mail className="h-7 w-7" />
        </a>
      </Button>

      {/* Portfolio Button - Smaller Size */}
      <Button
        variant="secondary"
        size="icon"
        className="rounded-full h-12 w-12 shadow-lg bg-green-600/80 hover:bg-green-700/90 text-white backdrop-blur-sm transition-all duration-300 ease-in-out hover:scale-105"
        asChild
      >
        <Link href="https://ajstars.in" target="_blank" rel="noopener noreferrer" aria-label="Visit Ayush's Portfolio">
          <LinkIcon className="h-6 w-6" />
        </Link>
      </Button>
    </div>
  );
};

export default ContactBubble; 