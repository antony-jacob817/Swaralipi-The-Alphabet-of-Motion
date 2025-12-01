import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '../../contexts/useAuth';
import { UserRound, Mail, LockKeyhole, ShieldCheck, UserCheck, EyeOff, Eye } from 'lucide-react';

export function RegisterForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    linkedStudentEmail: ''
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.role === 'parent' && !formData.linkedStudentEmail) {
      setError('Parents must provide a student email to link to');
      return;
    }

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role as 'student' | 'parent',
        linkedStudentEmail: formData.linkedStudentEmail || undefined
      });
      navigate('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Registration failed. Please try again.');
      } else {
        setError('Registration failed. Please try again.');
      }
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e0f2f7] to-[#e8f7e8] p-4 font-sans antialiased">
      <Card className="w-full max-w-5xl mx-auto flex flex-col md:flex-row rounded-2xl shadow-xl overflow-hidden">
        {/* Left Section: Registration Welcome */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center items-center text-center text-white bg-gradient-to-br from-[#4a90e2] to-[#6a5acd] relative overflow-hidden">
          {/* Abstract Shapes */}
          <div className="absolute top-0 left-0 w-48 h-48 bg-white/10 rounded-full -translate-x-1/4 -translate-y-1/4 animate-float blur-md"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3 animate-float animation-delay-2000 blur-md"></div>
          <div className="relative z-10">
            <h1 className="text-5xl font-extrabold mb-4 leading-tight">
              Create an Account
            </h1>
            <p className="text-lg opacity-90 mb-6 max-w-sm">
              Start your journey with us. Unlock a world of learning opportunities tailored for you.
            </p>
          </div>
        </div>

        {/* Right Section: Registration Form */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-4xl font-extrabold text-gray-900">
              Get Started
            </CardTitle>
            <CardDescription className="text-gray-500 text-base mt-2">
              Fill in the details to create your personalized profile
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center">
                  <UserRound className="h-4 w-4 mr-2 text-[#4a90e2]" /> Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="h-12 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#4a90e2] focus:ring-2 focus:ring-[#4a90e2]/20 transition-all duration-200 rounded-lg pl-10"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23a0aec0\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'left 0.75rem center', backgroundSize: '1.25rem' }}
                  required
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-[#6a5acd]" /> Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="h-12 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#4a90e2] focus:ring-2 focus:ring-[#4a90e2]/20 transition-all duration-200 rounded-lg pl-10"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23a0aec0\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'left 0.75rem center', backgroundSize: '1.25rem' }}
                  required
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center">
                  <LockKeyhole className="h-4 w-4 mr-2 text-[#4a90e2]" /> Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className="h-12 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#4a90e2] focus:ring-2 focus:ring-[#4a90e2]/20 pr-12 transition-all duration-200 rounded-lg pl-10"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23a0aec0\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v3h8z\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'left 0.75rem center', backgroundSize: '1.25rem' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 flex items-center">
                  <LockKeyhole className="h-4 w-4 mr-2 text-[#6a5acd]" /> Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  className="h-12 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#4a90e2] focus:ring-2 focus:ring-[#4a90e2]/20 transition-all duration-200 rounded-lg pl-10"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23a0aec0\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v3h8z\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'left 0.75rem center', backgroundSize: '1.25rem' }}
                  required
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium text-gray-700 flex items-center">
                  <ShieldCheck className="h-4 w-4 mr-2 text-[#4a90e2]" /> Role
                </Label>
                <Select value={formData.role} onValueChange={(value) => handleChange('role', value)}>
                  <SelectTrigger className="h-12 border-gray-300 text-gray-900 focus:border-[#4a90e2] focus:ring-2 focus:ring-[#4a90e2]/20 transition-all duration-200 rounded-lg pl-10"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23a0aec0\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'left 0.75rem center', backgroundSize: '1.25rem' }}
                  >
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 rounded-lg shadow-lg">
                    <SelectItem value="student" className="hover:bg-gray-50 cursor-pointer p-2">
                      Student
                    </SelectItem>
                    <SelectItem value="parent" className="hover:bg-gray-50 cursor-pointer p-2">
                      Parent
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Linked Student Email Field (for Parents) */}
              {formData.role === 'parent' && (
                <div className="space-y-2">
                  <Label htmlFor="linkedStudentEmail" className="text-sm font-medium text-gray-700 flex items-center">
                    <UserCheck className="h-4 w-4 mr-2 text-[#4a90e2]" /> Student's Email
                  </Label>
                  <Input
                    id="linkedStudentEmail"
                    type="email"
                    placeholder="Enter student's email to link"
                    value={formData.linkedStudentEmail}
                    onChange={(e) => handleChange('linkedStudentEmail', e.target.value)}
                    className="h-12 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#4a90e2] focus:ring-2 focus:ring-[#4a90e2]/20 transition-all duration-200 rounded-lg pl-10"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23a0aec0\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'left 0.75rem center', backgroundSize: '1.25rem' }}
                    required
                  />
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center animate-shake">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-3"></div>
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-[#4a90e2] to-[#6a5acd] hover:from-[#3a7bd5] hover:to-[#5a4acb] text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center text-lg"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Creating Account...
                  </div>
                ) : (
                  <>
                    Create Account
                  </>
                )}
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-8 text-center pt-6 border-t border-gray-100">
              <p className="text-base text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-[#4a90e2] hover:text-[#3a7bd5] font-semibold transition-colors duration-200 underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Add CSS for float and shake animations */}
      <style>{`
        @keyframes float {
          0% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(10px, -15px) scale(1.05);
          }
          66% {
            transform: translate(-10px, 15px) scale(0.95);
          }
          100% {
            transform: translate(0, 0) scale(1);
          }
        }
        .animate-float {
          animation: float 10s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}