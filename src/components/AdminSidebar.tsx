
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  BarChart3, 
  Settings,
  LogOut,
  ChevronRight,
  Map as MapIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/firebase';
import { useLogoutConfirm } from '@/context/LogoutConfirmContext';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Complaints', href: '/admin/complaints', icon: FileText },
  { label: 'Map View', href: '/admin/map', icon: MapIcon },
  { label: 'Citizens', href: '/admin/users', icon: Users },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const auth = useAuth();

  const { confirmLogout } = useLogoutConfirm();

  const handleLogout = async () => {
    confirmLogout(async () => {
      await signOut(auth);
    });
  };

  return (
    <aside className="w-64 h-screen bg-white dark:bg-slate-900 border-r dark:border-slate-800 flex flex-col sticky top-0 shrink-0">
      <div className="p-6 border-b dark:border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-lg">
          C
        </div>
        <div>
          <h2 className="font-headline font-bold text-slate-900 dark:text-slate-100 leading-tight">Admin</h2>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">CIVICcare Portal</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all group",
                isActive 
                  ? "bg-primary/5 text-primary" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={isActive ? "text-primary" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-350"} />
                {item.label}
              </div>
              {isActive && <ChevronRight size={14} className="text-primary" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t dark:border-slate-800 space-y-4">
        <Link href="/" className="flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-cyan-400 transition-colors">
          <Settings size={14} /> Global Settings
        </Link>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/5 dark:hover:bg-destructive/10 font-bold"
          onClick={handleLogout}
        >
          <LogOut className="mr-3" size={18} /> Logout
        </Button>
      </div>
    </aside>
  );
}
