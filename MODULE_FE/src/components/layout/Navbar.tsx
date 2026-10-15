import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/stores/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  BookOpen,
  Search,
  Bell,
  Menu,
  X,
  Home,
  Layers,
  Compass,
} from 'lucide-react';
import { ContributorApplyModal } from '@/features/contributor/components/ContributorApplyModal';

export function Navbar() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [applyModalOpen, setApplyModalOpen] = useState(false);

  interface NavLinkItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    exact?: boolean;
    badge?: string;
  }

  const baseNavLinks: NavLinkItem[] = [
    { name: 'Home', href: '/', icon: Home, exact: true },
    { name: 'Series Catalog', href: '/series', icon: Layers },
    { name: 'Roadmaps', href: '/roadmaps', icon: Compass },
  ];

  const navLinks: NavLinkItem[] = baseNavLinks;

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-md transition-all">
      <div className="w-full flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center size-9 rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
              <BookOpen className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-foreground flex items-center gap-1.5 leading-none">
                StudyIT
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  PRO
                </span>
              </span>
              <span className="text-[11px] text-muted-foreground font-normal mt-0.5">
                Learn by Practice Series
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 pl-4 border-l border-border/80">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.href
                : location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'text-primary bg-accent font-semibold'
                      : 'text-foreground/80 hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="size-4 text-muted-foreground" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-xs mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search labs, test cases, APIs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-8 text-xs bg-muted/70 rounded-full border border-border focus:border-primary focus:bg-background focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-background border border-border px-1.5 py-0.5 rounded text-muted-foreground font-mono">
              /
            </kbd>
          </div>
        </div>

        {/* Auth / User Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Notifications"
                className="relative p-2 rounded-full text-foreground/80 hover:bg-muted transition-colors"
              >
                <Bell className="size-4" />
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />
              </button>

              {/* User Avatar Badge (non-clickable, no redirect to dashboard) */}
              <div
                className="flex items-center gap-2 p-1 rounded-full select-none"
                aria-label={user?.name || 'User profile'}
              >
                <Avatar className="size-8 border border-border">
                  <AvatarImage src={user?.avatarUrl || undefined} alt={user?.name || 'User'} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="font-medium text-xs sm:text-sm">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs sm:text-sm shadow-sm">
                  Sign up
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-foreground hover:bg-muted focus:outline-none"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-border bg-card px-4 py-4 space-y-3 animate-in slide-in-from-top duration-200">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search courses and labs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs bg-muted/60 rounded-md border border-border"
            />
          </div>

          <div className="flex flex-col space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 text-sm rounded-md ${
                    isActive ? 'bg-accent text-primary font-semibold' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="size-4 text-muted-foreground" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <Badge variant="secondary" className="text-[10px] h-4 bg-primary/10 text-primary">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>

          {!isAuthenticated && (
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full text-xs">
                  Log in
                </Button>
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full text-xs bg-primary text-primary-foreground font-semibold">
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Modal đăng ký Contributor */}
      <ContributorApplyModal open={applyModalOpen} onOpenChange={setApplyModalOpen} />
    </header>
  );
}
