import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Users, 
  BarChart3, 
  MessageSquare, 
  GraduationCap, 
  FileText,
  BookOpen,LayoutDashboard,
  Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const { user, } = useAuth();

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
    <div className={cn('pb-22 w-64 bg-white border-r h-full flex flex-col', className)}>
      <div className="space-y-4 py-4 flex-1">
        <div className="px-3 py-2">
          <a href='/'><div className="flex items-center gap-2 px-4 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Swaralipi </h2>
          </div></a>
          
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    // Increased font size from text-sm to text-base
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-all hover:bg-gray-100",
                    isActive 
                      ? 'bg-blue-100 text-blue-600 border border-blue-200' 
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-5 w-5" /> {/* Slightly larger icons */}
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