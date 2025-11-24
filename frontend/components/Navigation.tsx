'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, Home, Leaf, Factory, Package, ShoppingCart, Bell, Menu, X, User, LogOut } from 'lucide-react';

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
  const { user, logout, isAuthenticated } = useAuth();

  // Hide navigation on login/register pages
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="text-lg sm:text-xl font-bold">Palm Oil Manager</h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {isAuthenticated && (
              <ul className="flex items-center gap-6">
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
            )}

            {/* User Menu */}
            {isAuthenticated && user && (
              <div className="flex items-center gap-4 border-l pl-6">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="font-medium">{user.full_name}</span>
                    <span className="text-xs text-muted-foreground">{user.role_name}</span>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          {isAuthenticated && (
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
          )}
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && isAuthenticated && (
          <div className="md:hidden pb-4 border-t mt-2 pt-2">
            {/* User Info */}
            {user && (
              <div className="flex items-center gap-2 px-4 py-3 mb-2 bg-accent rounded-md">
                <User className="h-5 w-5 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{user.full_name}</span>
                  <span className="text-xs text-muted-foreground">{user.role_name}</span>
                </div>
              </div>
            )}

            {/* Navigation Items */}
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

              {/* Logout Button */}
              <li>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}
