'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { BarChart3, Home, Leaf, Factory, Package, ShoppingCart, Bell, Menu, X } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/harvest', label: 'Harvest', icon: Leaf },
  { href: '/milling', label: 'Milling', icon: Factory },
  { href: '/storage', label: 'Storage', icon: Package },
  { href: '/sales', label: 'Sales', icon: ShoppingCart },
  { href: '/alerts', label: 'Alerts', icon: Bell },
];

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="text-lg sm:text-xl font-bold">Palm Oil Manager</h1>
          </div>

          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-accent"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t mt-2 pt-2">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}
