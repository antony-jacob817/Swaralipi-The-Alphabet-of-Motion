import { Button } from '@/components/ui/button';
import { LogOut, User, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { useTheme } from '@/contexts/ThemeContext';

export function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-white dark:bg-black shadow-sm border-b dark:border-gray-800 transition-colors duration-300 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              ISL Learning Platform
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle - Updated for Visibility */}
            <Button 
              variant="outline" 
              size="icon" 
              onClick={toggleTheme} 
              className="rounded-full border-gray-200 dark:border-gray-700 bg-white dark:bg-black hover:bg-black dark:hover:bg-white transition-all shadow-sm"
              title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5 text-pink-600 shrink-0" strokeWidth={2}/> 
              ) : (
                <Sun className="h-5 w-5 text-pink-600 shrink-0" strokeWidth={2} />
              )}
            </Button>

            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <User className="h-4 w-4" />
              <span>{user?.name}</span>
              <span className="px-2 py-1 bg-pink-100 dark:bg-pink-900/40 text-pink-800 dark:text-pink-300 rounded-full text-xs uppercase font-medium">
                {user?.role}
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="flex items-center gap-2 border-gray-200 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}