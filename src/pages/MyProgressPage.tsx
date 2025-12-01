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

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-600';
    if (progress >= 50) return 'bg-blue-600';
    return 'bg-yellow-600';
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Progress</h1>
            <p className="text-gray-600 mt-1">Tracking your learning journey</p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading your progress data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Progress</h1>
            <p className="text-gray-600 mt-1">Tracking your learning journey</p>
          </div>
        </div>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!studentProgress) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Progress</h1>
            <p className="text-gray-600 mt-1">Tracking your learning journey</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-600">No progress data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Progress</h1>
          <p className="text-gray-600 mt-1">Tracking your learning journey, {studentProgress.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            <Target className="h-4 w-4 mr-1" />
            {studentProgress.streak} day streak
          </Badge>
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            <Award className="h-4 w-4 mr-1" />
            {studentProgress.points} points
          </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Overall Progress</p>
                <p className="text-2xl font-bold text-gray-900">{studentProgress.overallProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">{studentProgress.weeklyTotal}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Chapters Completed</p>
                <p className="text-2xl font-bold text-gray-900">{studentProgress.chaptersCompleted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg. Daily Time</p>
                <p className="text-2xl font-bold text-gray-900">{studentProgress.avgDailyTime}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Your Learning Progress</CardTitle>
          <CardDescription>Keep up the great work!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl font-bold text-gray-900">{studentProgress.overallProgress}%</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {studentProgress.overallProgress >= 80 ? 'Excellent Progress' : 
               studentProgress.overallProgress >= 60 ? 'Good Progress' : 
               'Needs Improvement'}
            </Badge>
          </div>
          <Progress value={studentProgress.overallProgress} className="h-3" />
        </CardContent>
      </Card>

      {/* Subject Progress */}
      {studentProgress.subjects && studentProgress.subjects.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Subject Progress</CardTitle>
            <CardDescription>Your progress across all subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {studentProgress.subjects.map((subject, index) => {
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];
                const color = colors[index % colors.length] || subject.color;
                
                return (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${color}`}></div>
                        <h4 className="font-semibold text-gray-900">{subject.name}</h4>
                      </div>
                      <Badge variant="outline">{subject.progress}%</Badge>
                    </div>
                    <Progress value={subject.progress} className={`mb-2 ${getProgressColor(subject.progress)}`} />
                    <div className="flex justify-between text-sm text-gray-600">
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
        <Card>
          <CardHeader>
            <CardTitle>Subject Progress</CardTitle>
            <CardDescription>No subjects added yet</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Subjects will appear here once they are added by your teacher.</p>
          </CardContent>
        </Card>
      )}

      {/* Weekly Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Activity</CardTitle>
          <CardDescription>Your study hours this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {studentProgress.weeklyActivity.map((day, index) => (
              <div key={index} className="text-center">
                <div className="text-sm text-gray-600 mb-1">{day.day}</div>
                <div 
                  className="bg-blue-100 rounded-t-lg mx-auto transition-all hover:bg-blue-200"
                  style={{ height: `${day.hours * 40}px`, width: '30px' }}
                  title={`${day.hours} hours`}
                ></div>
                <div className="text-xs text-gray-500 mt-1">{day.hours}h</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      {studentProgress.achievements && studentProgress.achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Achievements</CardTitle>
            <CardDescription>Badges you've earned recently</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studentProgress.achievements.map((achievement, index) => (
                <div key={index} className={`flex items-center gap-3 p-3 bg-gradient-to-r ${achievement.color} border border-gray-200 rounded-lg`}>
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    {getIconComponent(achievement.icon)}
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">{achievement.title}</h5>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
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