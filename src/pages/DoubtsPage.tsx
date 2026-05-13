import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, User, BookOpen } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/useAuth';

interface Doubt {
  _id: string;
  studentName: string;
  studentEmail: string;
  subject: string;
  question: string;
  status: 'pending' | 'resolved' | 'escalated';
  timestamp: string;
  response?: string;
}

interface DoubtsPageProps {
  mode?: 'admin' | 'parent'; // Add this prop to distinguish between views
}

export function DoubtsPage({ mode = 'admin' }: DoubtsPageProps) {
  const { user } = useAuth();
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDoubts = async () => {
      try {
        setLoading(true);
        
        let url = 'https://antonyjacob817-swaralipi-api.hf.space/api/doubts';
        if (mode === 'parent' && user?.id) {
          url = `https://antonyjacob817-swaralipi-api.hf.space/api/parent/doubts/${user.id}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch doubts');
        }
        
        const data = await response.json();
        setDoubts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching doubts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDoubts();
  }, [mode, user?.id]);

  const updateDoubtStatus = async (doubtId: string, status: string) => {
    try {
      // Only admins can update doubt status
      if (mode !== 'admin') return;
      
      const response = await fetch(`https://antonyjacob817-swaralipi-api.hf.space/api/doubts/${doubtId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update doubt status');
      }
      
      // Update local state
      setDoubts(prevDoubts => 
        prevDoubts.map(doubt => 
          doubt._id === doubtId ? { ...doubt, status: status as Doubt['status'] } : doubt
        )
      );
    } catch (err) {
      console.error('Error updating doubt status:', err);
      alert('Failed to update doubt status');
    }
  };

  const filteredDoubts = filterStatus === 'all' 
    ? doubts 
    : doubts.filter(doubt => doubt.status === filterStatus);

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      escalated: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts = {
      pending: 'Pending',
      resolved: 'Resolved',
      escalated: 'Escalated'
    };
    return texts[status as keyof typeof texts] || status;
  };

  const getPageTitle = () => {
    return mode === 'admin' ? 'Student Doubts' : 'My Child\'s Doubts';
  };

  const getPageDescription = () => {
    return mode === 'admin' ? 'View and manage student questions' : 'View your child\'s questions';
  };

  const getEmptyStateMessage = () => {
    if (filterStatus !== 'all') {
      return `No doubts with status "${filterStatus}" found.`;
    }
    return mode === 'admin' 
      ? "No doubts have been submitted yet." 
      : "Your child hasn't submitted any doubts yet.";
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
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              Error: {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading doubts...</p>
              </div>
            ) : filteredDoubts.length > 0 ? (
              filteredDoubts.map((doubt) => (
                <Card key={doubt._id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{doubt.studentName}</h3>
                          <div className="text-sm text-gray-600">{doubt.studentEmail}</div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <BookOpen className="h-3 w-3" />
                            {doubt.subject}
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusBadge(doubt.status)}>
                        {getStatusText(doubt.status)}
                      </Badge>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-900">{doubt.question}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-3 w-3" />
                        {new Date(doubt.timestamp).toLocaleString()}
                      </div>
                      
                      {/* Only show action buttons for admin */}
                      {mode === 'admin' && (
                        <div className="flex gap-2">
                          {doubt.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => updateDoubtStatus(doubt._id, 'resolved')}
                              >
                                Resolve
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => updateDoubtStatus(doubt._id, 'escalated')}
                              >
                                Escalate
                              </Button>
                            </>
                          )}
                          {doubt.status === 'escalated' && (
                            <Button 
                              size="sm"
                              onClick={() => updateDoubtStatus(doubt._id, 'resolved')}
                            >
                              Follow Up
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {doubt.response && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-blue-800 mb-2">
                          {mode === 'admin' ? 'Response:' : 'Teacher\'s Response:'}
                        </h4>
                        <p className="text-blue-700">{doubt.response}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Doubts Found</h3>
                  <p className="text-gray-600">{getEmptyStateMessage()}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}