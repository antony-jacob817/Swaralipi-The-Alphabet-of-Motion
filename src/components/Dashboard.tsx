import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/useAuth';

export function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {user?.name}! Here's your overview.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Your current progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Courses Completed</span>
                <span className="font-bold">12</span>
              </div>
              <div className="flex justify-between">
                <span>Current Streak</span>
                <span className="font-bold">7 days</span>
              </div>
              <div className="flex justify-between">
                <span>Total Points</span>
                <span className="font-bold">1,245</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm">
                <div className="font-medium">Completed Mathematics Chapter</div>
                <div className="text-gray-500">2 hours ago</div>
              </div>
              <div className="text-sm">
                <div className="font-medium">Downloaded Science PDF</div>
                <div className="text-gray-500">5 hours ago</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>What would you like to do?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button className="w-full text-left p-2 hover:bg-gray-100 rounded">
                Continue Learning
              </button>
              <button className="w-full text-left p-2 hover:bg-gray-100 rounded">
                View Progress
              </button>
              <button className="w-full text-left p-2 hover:bg-gray-100 rounded">
                Explore Library
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}