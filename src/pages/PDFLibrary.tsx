import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Download, FileText, Grid, List } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PDFDocument {
  _id: string;
  id: string;
  title: string;
  subject: string;
  grade: string;
  fileSize: string;
  uploadDate: string;
  downloadUrl: string;
  viewUrl: string;
}

export function PDFLibrary() {
  const [documents, setDocuments] = useState<PDFDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPDFs = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/pdfs');
        
        if (!response.ok) {
          throw new Error('Failed to fetch PDFs');
        }
        
        const data = await response.json();
        setDocuments(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching PDFs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPDFs();
  }, []);

  // Get unique subjects and grades for filters
  const subjects = ['all', ...new Set(documents.map(doc => doc.subject))];
  const grades = ['all', ...new Set(documents.map(doc => doc.grade))];

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubject === 'all' || doc.subject === filterSubject;
    const matchesGrade = filterGrade === 'all' || doc.grade === filterGrade;
    
    return matchesSearch && matchesSubject && matchesGrade;
  });

  const getSubjectBadge = (subject: string) => {
    const colors = {
      Mathematics: 'bg-blue-100 text-blue-800',
      Science: 'bg-green-100 text-green-800',
      English: 'bg-purple-100 text-purple-800',
      'Environmental Studies': 'bg-orange-100 text-orange-800',
      History: 'bg-red-100 text-red-800',
      Geography: 'bg-yellow-100 text-yellow-800'
    };
    return colors[subject as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleDownload = async (doc: PDFDocument) => {
    try {
      const response = await fetch(`http://localhost:5000${doc.downloadUrl}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.title + '.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download PDF');
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download PDF');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">PDF Library</h1>
              <p className="text-gray-600 mt-1">Access all study materials and resources</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              Error: {error}
            </div>
          )}

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger>
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
                <Select value={filterGrade} onValueChange={setFilterGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map(grade => (
                      <SelectItem key={grade} value={grade}>
                        {grade === 'all' ? 'All Grades' : grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading documents...</p>
            </div>
          ) : filteredDocuments.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocuments.map((doc) => (
                  <Card key={doc._id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{doc.title}</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge className={getSubjectBadge(doc.subject)}>
                          {doc.subject}
                        </Badge>
                        <Badge variant="outline">{doc.grade}</Badge>
                      </div>
                      <div className="text-sm text-gray-600 mb-4">
                        <div>Size: {doc.fileSize}</div>
                        <div>Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-4">Document</th>
                        <th className="text-left p-4">Subject</th>
                        <th className="text-left p-4">Grade</th>
                        <th className="text-left p-4">Size</th>
                        <th className="text-left p-4">Upload Date</th>
                        <th className="text-right p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDocuments.map((doc) => (
                        <tr key={doc._id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                <FileText className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{doc.title}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={getSubjectBadge(doc.subject)}>
                              {doc.subject}
                            </Badge>
                          </td>
                          <td className="p-4">{doc.grade}</td>
                          <td className="p-4">{doc.fileSize}</td>
                          <td className="p-4">
                            {new Date(doc.uploadDate).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="sm"
                                onClick={() => handleDownload(doc)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Documents Found</h3>
                <p className="text-gray-600">
                  {documents.length === 0 
                    ? "No documents have been uploaded yet." 
                    : "No documents match your search criteria. Try adjusting your filters."
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}