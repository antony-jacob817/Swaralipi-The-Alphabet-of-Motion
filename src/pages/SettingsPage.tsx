import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Lock, Save, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';

export function SettingsPage() {
  const { user, updateProfile, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [memberSince, setMemberSince] = useState<string>('');

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (user?.id) {
        try {
          const response = await fetch(`https://antonyjacob817-swaralipi-api.hf.space/api/user/${user.id}`);
          const userData = await response.json();
          
          if (response.ok && userData.createdAt) {
            const joinDate = new Date(userData.createdAt);
            const formattedDate = joinDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            setMemberSince(formattedDate);
          }
        } catch (error) {
          console.error('Failed to fetch user details:', error);
          setMemberSince('January 15, 2024');
        }
      }
    };

    fetchUserDetails();
  }, [user?.id]);

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setMessage('');

    try {
      if (name.trim() === '') {
        throw new Error('Name cannot be empty');
      }

      const response = await fetch('https://antonyjacob817-swaralipi-api.hf.space/api/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user?.id, name: name.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      await updateProfile({ name: name.trim() });
      await refreshUser();
      
      showMessage('Profile updated successfully! ✅', 'success');
    
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Failed to update profile', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setMessage('');

    try {
      if (!currentPassword) {
        throw new Error('Current password is required');
      }

      if (newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters long');
      }

      if (newPassword !== confirmPassword) {
        throw new Error('New passwords do not match');
      }

      const response = await fetch('https://antonyjacob817-swaralipi-api.hf.space/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      showMessage('Password changed successfully! ✅', 'success');
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Failed to change password', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account settings and preferences</p>
      </div>

      {message && (
        <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-md border ${
          messageType === 'success' 
            ? 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300' 
            : 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
        }`}>
          <div className="flex items-center">
            {messageType === 'success' ? (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span className="font-medium">{message}</span>
          </div>
        </div>
      )}

      <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400"
              />
              <p className="text-sm text-gray-500 dark:text-gray-500">Email cannot be changed</p>
            </div>

            <Button 
              type="submit" 
              disabled={profileLoading || name.trim() === user?.name}
              className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white"
            >
              {profileLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Update Profile
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-gray-700 dark:text-gray-300">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className="bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-gray-700 dark:text-gray-300">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 characters)"
                  minLength={6}
                  required
                  className="bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  className="bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
              className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white"
            >
              {passwordLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Account Information</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Your account details and membership
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Account Type:</span>
              <span className="font-medium capitalize text-gray-900 dark:text-white">{user?.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Member Since:</span>
              <span className="font-medium text-gray-900 dark:text-white">{memberSince || 'Loading...'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <Badge variant="outline" className="bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800">
                Active
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">User ID:</span>
              <span className="font-mono text-xs text-gray-900 dark:text-white">{user?.id}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}