"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BarChart3, 
  Settings, 
  BookOpen, 
  Activity, 
  History, 
  Home,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { href: "/admin", icon: Home, label: "Dashboard" },
  { href: "/admin/events", icon: Settings, label: "Events" },
  { href: "/admin/teams", icon: Users, label: "Teams" },
  { href: "/admin/problems", icon: BookOpen, label: "Problems" },
  { href: "/admin/monitor", icon: Activity, label: "Live Monitor" },
  { href: "/admin/submissions", icon: History, label: "Submissions" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-bold font-mono text-primary italic">Admin Panel</h2>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <BarChart3 className="h-3 w-3" />
            Back to Public View
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-muted/30">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
