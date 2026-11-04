'use client';

import { useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { LinkedInIcon, XIcon } from '@/components/ui/BrandIcons';

interface SocialShareProps {
  url: string;
  title: string;
}

export function SocialShare({ url, title }: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const encoded = { url: encodeURIComponent(url), title: encodeURIComponent(title) };

  return (
    <div className="flex items-center gap-2">
      <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-faint">Share</span>
      <a
        href={`https://twitter.com/intent/tweet?url=${encoded.url}&text=${encoded.title}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X / Twitter"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-foreground hover:text-foreground"
      >
        <XIcon className="h-4 w-4" />
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded.url}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-foreground hover:text-foreground"
      >
        <LinkedInIcon className="h-4 w-4" />
      </a>
      <button
        onClick={copy}
        aria-label="Copy link"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-foreground hover:text-foreground"
      >
        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Link2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
