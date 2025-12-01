// pages/AboutPage.tsx
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Heart } from 'lucide-react';

export function AboutPage() {
  return (
      <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About EduLearn</h1>
          <p className="text-xl text-gray-600">Revolutionizing education through technology</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <Card>
            <CardHeader>
              <Target className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Our Mission</CardTitle>
              <CardDescription>
                To make quality education accessible to everyone, everywhere through innovative technology.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Heart className="h-12 w-12 text-red-600 mb-4" />
              <CardTitle>Our Values</CardTitle>
              <CardDescription>
                We believe in personalized learning, innovation, and creating positive educational impact.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center">
          <Link to="/register">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Join Our Community
            </Button>
          </Link>
        </div>
      </div>
  );
}