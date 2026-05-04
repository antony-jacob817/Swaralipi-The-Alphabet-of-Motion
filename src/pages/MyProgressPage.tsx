import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, BookOpen, Target, Award, BarChart3, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';

interface SubjectProgress {
  name: string;
  progress: number;
  chaptersCompleted: number;
  totalChapters: number;
  lastActivity: string;
  color: string;
}

interface WeeklyActivity {
  day: string;
  hours: number;
}

interface Achievement {
  title: string;
  description: string;
  icon: string;
  color: string;
}

interface StudentProgressData {
  name: string;
  overallProgress: number;
  points: number;
  streak: number;
  weeklyTotal: string;
  chaptersCompleted: number;
  avgDailyTime: string;
  subjects: SubjectProgress[];
  weeklyActivity: WeeklyActivity[];
  achievements: Achievement[];
}

export function MyProgressPage() {
  const { user } = useAuth();
  const [studentProgress, setStudentProgress] = useState<StudentProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgressData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/student/progress/${user.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch progress data');
        }
        
        const data = await response.json();
        setStudentProgress(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching progress data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [user?.id]);

  const getIconComponent = (iconName: string) => {
    const icons = {
      Award: Award,
      Target: Target,
      BookOpen: BookOpen,
      Clock: Clock
    };
    const IconComponent = icons[iconName as keyof typeof icons] || Award;
    return <IconComponent className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Progress</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Tracking your learning journey</p>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 dark:border-pink-400 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading your progress data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Progress</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Tracking your learning journey</p>
        </div>
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!studentProgress) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Progress</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Tracking your learning journey</p>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">No progress data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Progress</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Tracking your learning journey, {studentProgress.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-800">
            <Target className="h-4 w-4 mr-1" />
            {studentProgress.streak} day streak
          </Badge>
          <Badge variant="outline" className="bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-800">
            <Award className="h-4 w-4 mr-1" />
            {studentProgress.points} points
          </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                <BarChart3 className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Overall Progress</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{studentProgress.overallProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                <Calendar className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">This Week</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{studentProgress.weeklyTotal}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                <BookOpen className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Chapters Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{studentProgress.chaptersCompleted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                <Clock className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Daily Time</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{studentProgress.avgDailyTime}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Your Learning Progress</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">Keep up the great work!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{studentProgress.overallProgress}%</span>
            <Badge className="bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 border-0">
              {studentProgress.overallProgress >= 80 ? 'Excellent Progress' : 
               studentProgress.overallProgress >= 60 ? 'Good Progress' : 
               'Needs Improvement'}
            </Badge>
          </div>
          <Progress value={studentProgress.overallProgress} className="h-3 [&>div]:bg-pink-600" />
        </CardContent>
      </Card>

      {/* Subject Progress */}
      {studentProgress.subjects && studentProgress.subjects.length > 0 ? (
        <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Subject Progress</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Your progress across all subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {studentProgress.subjects.map((subject, index) => {
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];
                const color = colors[index % colors.length] || subject.color;
                
                return (
                  <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md dark:hover:shadow-gray-800 transition-shadow bg-white dark:bg-black">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${color}`}></div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{subject.name}</h4>
                      </div>
                      <Badge variant="outline" className="dark:text-gray-300 dark:border-gray-600">{subject.progress}%</Badge>
                    </div>
                    <Progress value={subject.progress} className="mb-2 [&>div]:bg-pink-600" />
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>
                        {subject.chaptersCompleted} of {subject.totalChapters} chapters completed
                      </span>
                      <span>Last activity: {new Date(subject.lastActivity).toLocaleDateString()}</span>
                    </div>
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

      {/* Weekly Activity */}
      <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Weekly Activity</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">Your study hours this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {studentProgress.weeklyActivity.map((day, index) => (
              <div key={index} className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{day.day}</div>
                <div 
                  className="bg-pink-100 dark:bg-pink-900/30 rounded-t-lg mx-auto transition-all hover:bg-pink-200 dark:hover:bg-pink-800/50"
                  style={{ height: `${day.hours * 40}px`, width: '30px' }}
                  title={`${day.hours} hours`}
                ></div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">{day.hours}h</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      {studentProgress.achievements && studentProgress.achievements.length > 0 && (
        <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Recent Achievements</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Badges you've earned recently</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studentProgress.achievements.map((achievement, index) => (
                <div key={index} className={`flex items-center gap-3 p-3 bg-gradient-to-r ${achievement.color} border border-gray-200 dark:border-gray-700 rounded-lg`}>
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300">
                    {getIconComponent(achievement.icon)}
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white">{achievement.title}</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}