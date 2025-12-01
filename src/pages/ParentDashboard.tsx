import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, BarChart3, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { useState, useEffect } from 'react';

interface StudentData {
  id: string;
  name: string;
  email: string;
  grade: string;
  overallProgress: number;
  points: number;
  currentStreak: number;
  weeklyTime: string;
  chaptersCompleted: number;
  subjects: Array<{
    name: string;
    progress: number;
    completedChapters: number;
    totalChapters: number;
  }>;
}

interface Doubt {
  _id: string;
  studentName: string;
  studentEmail: string;
  subject: string;
  question: string;
  status: 'pending' | 'resolved' | 'escalated';
  timestamp: string;
}

export function ParentDashboard() {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [pendingDoubts, setPendingDoubts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch student data
        const studentResponse = await fetch(`http://localhost:5000/api/parent/student/${user?.id}`);
        if (!studentResponse.ok) {
          throw new Error('Failed to fetch student data');
        }
        const studentData = await studentResponse.json();
        setStudentData(studentData);
        
        // Fetch doubts count
        const doubtsResponse = await fetch(`http://localhost:5000/api/parent/doubts/${user?.id}`);
        if (doubtsResponse.ok) {
          const doubtsData: Doubt[] = await doubtsResponse.json();
          const pending = doubtsData.filter(doubt => doubt.status === 'pending').length;
          setPendingDoubts(pending);
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching parent data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Parent Dashboard</h1>
            <p className="text-gray-600 mt-1">Loading student data...</p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Parent Dashboard</h1>
            <p className="text-gray-600 mt-1">Error loading data</p>
          </div>
        </div>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Parent Dashboard</h1>
            <p className="text-gray-600 mt-1">No student data found</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-600">No student is linked to your account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Parent Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitoring {studentData.name}'s progress</p>
        </div>
        <Badge variant="outline">{studentData.grade}</Badge>
      </div>

      {/* Child Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Overall Progress</p>
                <p className="text-2xl font-bold text-gray-900">{studentData.overallProgress}%</p>
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
                <p className="text-sm text-gray-600">Weekly Activity</p>
                <p className="text-2xl font-bold text-gray-900">{studentData.weeklyTime}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Doubts</p>
                <p className="text-2xl font-bold text-gray-900">{pendingDoubts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Subject Progress</CardTitle>
          <CardDescription>{studentData.name}'s performance across subjects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {studentData.subjects.map((subject, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{subject.name}</h4>
                  <Badge variant="outline">{subject.progress}%</Badge>
                </div>
                <Progress value={subject.progress} className="mb-2" />
                <div className="text-sm text-gray-600">
                  {subject.completedChapters} of {subject.totalChapters} chapters completed
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link to="/parent/progress">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <h3 className="text-lg font-semibold">Detailed Progress</h3>
              </div>
              <p className="text-sm text-gray-600">View detailed progress reports and analytics</p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link to="/parent/doubts">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="h-8 w-8 text-orange-600" />
                <h3 className="text-lg font-semibold">View Doubts</h3>
              </div>
              <p className="text-sm text-gray-600">Check and manage your child's questions</p>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}