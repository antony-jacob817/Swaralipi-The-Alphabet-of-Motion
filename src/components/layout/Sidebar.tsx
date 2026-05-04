import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Users, 
  BarChart3, 
  MessageSquare, 
  GraduationCap,
  Hand, 
  FileText,
  BookOpen,
  LayoutDashboard,
  Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();

  const getAdminNavItems = () => [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Manage Users', href: '/users', icon: Users },
    { name: 'Student Progress', href: '/admin/progress', icon: BarChart3 },
    { name: 'Manage Subjects', href: '/subjects', icon: BookOpen },
    { name: 'Doubts', href: '/admin/doubts', icon: MessageSquare },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const getStudentNavItems = () => [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Dashboard', href: '/student', icon: LayoutDashboard },
    { name: 'Teaching Mode', href: '/teaching', icon: GraduationCap },
    { name: 'PDF Library', href: '/pdfs', icon: FileText },
    { name: 'My Progress', href: '/progress', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const getParentNavItems = () => [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Dashboard', href: '/parent', icon: LayoutDashboard },
    { name: 'Child Progress', href: '/parent/progress', icon: BarChart3 },
    { name: 'Child Doubts', href: '/parent/doubts', icon: MessageSquare },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const getNavItems = () => {
    switch (user?.role) {
      case 'admin': return getAdminNavItems();
      case 'student': return getStudentNavItems();
      case 'parent': return getParentNavItems();
      default: return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className={cn('w-64 bg-white dark:bg-black border-r dark:border-gray-800 h-full flex flex-col transition-colors duration-300', className)}>
      <div className="space-y-4 py-4 flex-1">
        <div className="px-3 py-2">
          <a href='/'>
            <div className="flex items-center gap-2 px-4 mb-8">
              <div className="w-8 h-8 bg-pink-600 dark:bg-pink-500 rounded-lg flex items-center justify-center">
                <Hand className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Swaralipi</h2>
            </div>
          </a>
          
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-all hover:bg-gray-100 dark:hover:bg-gray-900",
                    isActive 
                      ? 'bg-pink-100 text-pink-600 border border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}