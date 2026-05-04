// pages/HomePage.tsx
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Hand, Users, Brain, ArrowRight } from 'lucide-react';

export function HomePage() {
  return (
    <div className="bg-white dark:bg-black transition-colors duration-300">    
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Transform Your <span className="text-pink-600">Learning</span> Experience
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-3xl mx-auto">
              Discover a modern learning platform that adapts to your needs. 
              Interactive lessons, personalized progress tracking, and expert guidance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/register">
                <Button size="lg" className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 text-lg">
                  Start Learning Free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-8 py-3 text-lg">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Why Choose Swaralipi?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Interactive Learning", icon: BookOpen, color: "pink", desc: "Engaging lessons with real-time feedback" },
              { title: "Personalized Path", icon: Brain, color: "green", desc: "Adaptive learning paths tailored to your goals" },
              { title: "Expert Support", icon: Users, color: "purple", desc: "24/7 access to experienced educators" }
            ].map((f, i) => (
              <Card key={i} className="border-0 shadow-lg dark:bg-black dark:border-gray-800 hover:shadow-xl transition-all">
                <CardHeader>
                  <div className={`w-12 h-12 bg-${f.color}-100 dark:bg-${f.color}-900/30 rounded-lg flex items-center justify-center mb-4`}>
                    <f.icon className={`h-6 w-6 text-${f.color}-600`} />
                  </div>
                  <CardTitle className="dark:text-white">{f.title}</CardTitle>
                  <CardDescription className="dark:text-gray-400">{f.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto text-center grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Active Students", val: "10K+", col: "text-pink-600" },
            { label: "Expert Tutors", val: "500+", col: "text-green-600" },
            { label: "Success Rate", val: "95%", col: "text-purple-600" },
            { label: "Support", val: "24/7", col: "text-orange-600" }
          ].map((s, i) => (
            <div key={i}>
              <div className={`text-3xl md:text-4xl font-bold ${s.col} mb-2`}>{s.val}</div>
              <div className="text-gray-600 dark:text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section - Pink Accent remains consistent */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-pink-300 dark:bg-pink-900 transition-colors">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-6">Ready to Start?</h2>
          <p className="text-xl text-black dark:text-pink-50 mb-8">Join thousands of students transforming their education</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register"><Button size="lg" className="hover:bg-white dark:hover:bg-black bg-pink-300 text-black border-black dark:text-white dark:border-white dark:bg-pink-800 px-8 py-3 text-lg">Create Account</Button></Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-12 px-4 sm:px-6 lg:px-8 border-t dark:border-gray-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Hand className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold">EduLearn</span>
            </div>
            <p className="text-gray-400">
              Transforming education through innovative technology and personalized learning experiences.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/pdfs" className="hover:text-white transition-colors">PDF Library</Link></li>
              <li><Link to="/teaching" className="hover:text-white transition-colors">Teaching Mode</Link></li>
              <li><Link to="/subjects" className="hover:text-white transition-colors">Subjects</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Connect</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Email: support@edulearn.com</li>
              <li>Phone: +1 (555) 123-4567</li>
              <li>Address: 123 Education St, Learning City</li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 EduLearn. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}