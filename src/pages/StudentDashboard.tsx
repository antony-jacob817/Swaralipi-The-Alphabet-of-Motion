import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, GraduationCap, FileText, Trophy, Target, Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface Subject {
  name: string;
  progress: number;
  completedChapters: number;
  totalChapters: number;
}

interface StudentData {
  name: string;
  totalProgress: number;
  pointsEarned: number;
  currentStreak: number;
  weeklyTime: string;
  chaptersCompleted: number;
  avgDailyTime: string;
  subjects: Subject[];
}

export function StudentDashboard() {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/student/dashboard/${user.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch student data');
        }
        
        const data = await response.json();
        setStudentData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching student data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>

        {/* Quick Actions Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-white dark:bg-black border-gray-200 dark:border-gray-700">
              <CardContent className="p-6 text-center">
                <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
                <Skeleton className="h-6 w-40 mx-auto mb-2" />
                <Skeleton className="h-4 w-32 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Overview Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-white dark:bg-black border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Overall Progress Skeleton */}
        <Card className="mb-8 bg-white dark:bg-black border-gray-200 dark:border-gray-700">
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-3 w-full" />
          </CardContent>
        </Card>

        {/* Subject Progress Skeleton */}
        <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-700">
          <CardHeader>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-4 h-4 rounded-full" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                    <Skeleton className="h-6 w-12" />
                  </div>
                  <Skeleton className="h-2 w-full mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-red-500 dark:text-red-400 mb-4">Error: {error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-400">No data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {studentData.name}!</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Continue your learning journey</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm bg-pink-50 dark:bg-pink-900/30 px-3 py-2 rounded-lg">
            <Trophy className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
            <span className="font-semibold text-gray-900 dark:text-white">{studentData.pointsEarned} Points</span>
          </div>
          <div className="flex items-center gap-2 text-sm bg-orange-50 dark:bg-orange-900/30 px-3 py-2 rounded-lg">
            <Target className="h-4 w-4 text-orange-500 dark:text-orange-400" />
            <span className="font-semibold text-gray-900 dark:text-white">{studentData.currentStreak} Day Streak</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-lg dark:hover:shadow-gray-800 transition-shadow cursor-pointer bg-white dark:bg-black border-gray-200 dark:border-gray-700">
          <Link to="/teaching">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="h-8 w-8 text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Teaching Mode</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Learn with ISL avatar teacher</p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg dark:hover:shadow-gray-800 transition-shadow cursor-pointer bg-white dark:bg-black border-gray-200 dark:border-gray-700">
          <Link to="/pdfs">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">PDF Library</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Access all study materials</p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg dark:hover:shadow-gray-800 transition-shadow cursor-pointer bg-white dark:bg-black border-gray-200 dark:border-gray-700">
          <Link to="/progress">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">My Progress</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Track your learning journey</p>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 dark:bg-pink-900/50 rounded-lg">
                <Calendar className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">This Week</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{studentData.weeklyTime}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 dark:bg-pink-900/50 rounded-lg">
                <BookOpen className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Chapters Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{studentData.chaptersCompleted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 dark:bg-pink-900/50 rounded-lg">
                <Clock className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Daily Time</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{studentData.avgDailyTime}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card className="mb-8 bg-white dark:bg-black border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Your Learning Progress</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">Keep up the great work!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{studentData.totalProgress}%</span>
            <Badge className="bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 border-0">
              {studentData.totalProgress >= 80 ? 'Excellent Progress' : 
               studentData.totalProgress >= 60 ? 'Good Progress' : 
               'Needs Improvement'}
            </Badge>
          </div>
          <Progress value={studentData.totalProgress} className="h-3 [&>div]:bg-pink-600" />
        </CardContent>
      </Card>

      {/* Subject Progress */}
      {studentData.subjects && studentData.subjects.length > 0 ? (
        <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Subject Progress</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Your progress across all subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {studentData.subjects.map((subject, index) => {
                // Keep colored dots for subject differentiation
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];
                const dotColor = colors[index % colors.length];
                
                return (
                  <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md dark:hover:shadow-gray-800 transition-shadow bg-white dark:bg-black">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${dotColor}`}></div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{subject.name}</h4>
                      </div>
                      <Badge variant="outline" className="dark:text-gray-300 dark:border-gray-600">{subject.progress}%</Badge>
                    </div>
                    {/* All subject progress bars are pink */}
                    <Progress value={subject.progress} className="mb-2 [&>div]:bg-pink-600" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {subject.completedChapters} of {subject.totalChapters} chapters completed
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Subject Progress</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">No subjects added yet</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">Subjects will appear here once they are added by your teacher.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}