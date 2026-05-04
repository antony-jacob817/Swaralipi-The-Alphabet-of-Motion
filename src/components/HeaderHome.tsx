// components/HeaderHome.tsx
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/useAuth';
import { useTheme } from '@/contexts/ThemeContext'; // Import hook
import { Hand, LogOut, User, Moon, Sun } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white/90 dark:bg-black/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Hand className="h-8 w-8 text-pink-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">Swaralipi</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {['Home', 'About', 'Contact'].map((item) => (
              <Link 
                key={item}
                to={item === 'Home' ? '/' : `/${item.toLowerCase()}`} 
                className="text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-500 transition-colors font-medium"
              >
                {item}
              </Link>
            ))}
            {user && (
              <Link to="/dashboard" className="text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-500 transition-colors font-medium">
                Dashboard
              </Link>
            )}
          </div>

          {/* Auth Buttons / User Info */}
          <div className="flex items-center space-x-4">
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

            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user.name}</span>
                  <span className="px-2 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 text-xs font-medium rounded-full capitalize">
                    {user.role}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center space-x-2 dark:border-gray-700 dark:text-gray-300">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login">
                  <Button variant="ghost" className="text-gray-700 dark:text-white hover:text-pink-600">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-pink-600 hover:bg-pink-700 text-white">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}