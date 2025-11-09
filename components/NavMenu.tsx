"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown, User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";

const NavMenu = () => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ name?: string; email?: string; isAdmin?: boolean; } | null>(null);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/"
    },
    {
      name: "My Interviews",
      href: "/my-interviews"
    },
    {
      name: "Company Interviews",
      href: "/companies"
    },
    {
      name: "Create Interview",
      href: "/interview"
    }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 p-3 hover:bg-card/80 bg-card/50 backdrop-blur-sm border border-border rounded-xl shadow-lg"
      >
        <Image
          src="/logo.svg"
          alt="Mock Interview"
          width={32}
          height={32}
          className="w-8 h-8"
        />
        <div className="flex flex-col items-start">
          <h2 className="text-lg font-bold text-primary">Real Talk</h2>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-card/95 backdrop-blur-md rounded-xl shadow-xl border border-border z-[9999] overflow-hidden">
          <div className="p-4">
            {/* Navigation Section */}
            <nav className="flex flex-col space-y-1 mb-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground ${
                    pathname === item.href
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  <span>{item.name}</span>
                </Link>
              ))}
              
              {/* Admin Dashboard Link - Only visible for admin users */}
              {user?.isAdmin && (
                <Link
                  href="/admin"
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground ${
                    pathname?.startsWith('/admin')
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  <span>Admin Dashboard</span>
                </Link>
              )}
            </nav>

            {/* User Profile Section */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-card-foreground font-medium">{user?.name || 'User'}</p>
                    {user?.isAdmin && (
                      <span className="px-1.5 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">{user?.email || 'user@example.com'}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent"
                asChild
              >
                <Link href="/sign-out" onClick={() => setOpen(false)}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavMenu;
