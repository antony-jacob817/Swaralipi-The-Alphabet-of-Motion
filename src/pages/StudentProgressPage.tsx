import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, BookOpen, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';

interface ProgressData {
  studentId: string;
  studentName: string;
  subject: string;
  progress: number;
  chaptersCompleted: number;
  totalChapters: number;
  lastActivity: string;
}

interface StudentProgressPageProps {
  mode?: 'admin' | 'parent';
}

export function StudentProgressPage({ mode = 'admin' }: StudentProgressPageProps) {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeCourses: 0,
    avgProgress: 0,
    weeklyTime: '0h 0m'
  });

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoading(true);
        
        let url = 'http://localhost:5000/api/admin/student-progress';
        if (mode === 'parent' && user?.id) {
          url = `http://localhost:5000/api/parent/student-progress/${user.id}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch progress data');
        }
        
        const data = await response.json();
        
        // For parent mode, we need to transform the data structure
        if (mode === 'parent') {
          // Parent API returns a single student object with subjects array
          // We need to transform it to match the ProgressData interface
          interface ParentSubject {
            name: string;
            progress: number;
            completedChapters: number;
            totalChapters: number;
            lastActivity: string;
          }
          const transformedData: ProgressData[] = data.subjects.map((subject: ParentSubject) => ({
            studentId: data.id,
            studentName: data.name,
            subject: subject.name,
            progress: subject.progress,
            chaptersCompleted: subject.completedChapters,
            totalChapters: subject.totalChapters,
            lastActivity: subject.lastActivity
          }));
          setProgressData(transformedData);
          
          // Calculate stats for parent view
          const weeklyTime = data.weeklyTotal || '0h 0m';
          const avgProgress = data.overallProgress || 0;
          const activeCourses = new Set(data.subjects.map((s: { name: string }) => s.name)).size;
          
          setStats({
            totalStudents: 1,
            activeCourses,
            avgProgress,
            weeklyTime
          });
        } else {
          // Admin API already returns the correct format
          setProgressData(data);
          
          // Calculate stats for admin view
          const totalStudents = new Set(data.map((item: ProgressData) => item.studentId)).size;
          const activeCourses = new Set(data.map((item: ProgressData) => item.subject)).size;
          const avgProgress = data.length > 0 
            ? Math.round(data.reduce((sum: number, item: ProgressData) => sum + item.progress, 0) / data.length)
            : 0;
          
          // Calculate weekly time from lastActivity timestamps
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          
          const recentActivities = data.filter((item: ProgressData) => 
            new Date(item.lastActivity) >= oneWeekAgo
          );
          
          // Estimate weekly time based on activity count (assuming 1 hour per activity)
          const weeklyHours = Math.min(recentActivities.length, 45); // Cap at 45h
          const weeklyTime = `${weeklyHours}h 0m`;
          
          setStats({
            totalStudents,
            activeCourses,
            avgProgress,
            weeklyTime
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching progress data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [mode, user?.id]);

  // Get unique subjects for filter
  const subjects = ['all', ...new Set(progressData.map(item => item.subject))];
  const filteredData = selectedSubject === 'all' 
    ? progressData 
    : progressData.filter(item => item.subject === selectedSubject);

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-600';
    if (progress >= 50) return 'bg-blue-600';
    return 'bg-yellow-600';
  };

  const getPageTitle = () => {
    return mode === 'admin' ? 'Student Progress' : 'Child Progress';
  };

  const getPageDescription = () => {
    return mode === 'admin' 
      ? 'Track and monitor all student performance' 
      : 'Track your child\'s performance';
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{getPageTitle()}</h1>
              <p className="text-gray-600 mt-1">{getPageDescription()}</p>
            </div>
            {progressData.length > 0 && (
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>
                      {subject === 'all' ? 'All Subjects' : subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              Error: {error}
            </div>
          )}

          {/* Stats Overview - Only show for admin */}
          {mode === 'admin' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Students</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <BookOpen className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Active Courses</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.activeCourses}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Avg. Progress</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.avgProgress}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Calendar className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">This Week</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.weeklyTime}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>
                {mode === 'admin' ? 'Student Progress Details' : 'Child Progress Details'}
              </CardTitle>
              <CardDescription>
                {mode === 'admin' 
                  ? 'Detailed progress report for all students'
                  : 'Detailed progress report for your child'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading progress data...</p>
                </div>
              ) : filteredData.length > 0 ? (
                <div className="space-y-6">
                  {filteredData.map((item, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{item.studentName}</h3>
                          <p className="text-sm text-gray-600">{item.subject}</p>
                        </div>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Last activity: {new Date(item.lastActivity).toLocaleDateString()}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span className="font-medium">{item.progress}%</span>
                        </div>
                        <Progress value={item.progress} className={getProgressColor(item.progress)} />
                        
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>
                            {item.chaptersCompleted} of {item.totalChapters} chapters completed
                          </span>
                          <span>
                            {Math.round((item.chaptersCompleted / item.totalChapters) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    {mode === 'admin' ? 'No progress data found.' : 'No progress data found for your child.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}