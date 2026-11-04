'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, PenLine, Search, X } from 'lucide-react';
import type { Category, WebsiteSettings } from '@/types/strapi';
import { cn } from '@/lib/utils';

interface NavbarProps {
  settings: WebsiteSettings | null;
  categories: Category[];
}

export function Navbar({ settings, categories }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const siteName = settings?.siteName ?? 'Meridian';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const links = [
    { href: '/', label: 'Home' },
    { href: '/blog', label: 'Articles' },
    ...categories.slice(0, 3).map((c) => ({ href: `/category/${c.slug}`, label: c.name })),
    { href: '/about', label: 'About' },
  ];

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur-md transition-shadow',
        scrolled ? 'border-border shadow-[0_1px_8px_rgba(0,0,0,0.05)]' : 'border-transparent'
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-serif text-2xl font-semibold tracking-tight"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
            <PenLine className="h-4 w-4" strokeWidth={2.5} />
          </span>
          {siteName}
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-stone-100 hover:text-foreground',
                pathname === link.href && 'bg-stone-100 text-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/search"
            aria-label="Search"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-stone-100 hover:text-foreground"
          >
            <Search className="h-[18px] w-[18px]" />
          </Link>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-stone-100 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-background px-4 pb-4 pt-2 md:hidden" aria-label="Mobile">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-lg px-3 py-2.5 text-[15px] font-medium text-foreground hover:bg-stone-100"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
