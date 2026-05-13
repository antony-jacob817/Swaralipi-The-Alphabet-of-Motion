import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Download, FileText, LayoutGrid, List } from 'lucide-react';
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
        const response = await fetch('https://antonyjacob817-swaralipi-api.hf.space/api/pdfs');
        
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
      Mathematics: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      Science: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      English: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'Environmental Studies': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      History: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      Geography: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
    };
    return colors[subject as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  };

  const handleDownload = async (doc: PDFDocument) => {
    try {
      const response = await fetch(`https://antonyjacob817-swaralipi-api.hf.space${doc.downloadUrl}`);
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
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">PDF Library</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Access all study materials and resources</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-pink-600 hover:bg-pink-700 text-white' : 'dark:text-gray-300 dark:border-gray-700'}
          >
            <LayoutGrid className="h-5 w-5 shrink-0" strokeWidth={2}/>
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-pink-600 hover:bg-pink-700 text-white' : 'dark:text-gray-300 dark:border-gray-700'}
          >
            <List className="h-5 w-5 shrink-0" strokeWidth={2}/>
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-6">
          Error: {error}
        </div>
      )}

      {/* Filters and Search */}
      <Card className="mb-6 bg-white dark:bg-black border-gray-200 dark:border-gray-800">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
                {subjects.map(subject => (
                  <SelectItem key={subject} value={subject} className="dark:text-white dark:focus:bg-gray-900">
                    {subject === 'all' ? 'All Subjects' : subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterGrade} onValueChange={setFilterGrade}>
              <SelectTrigger className="bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
                <SelectValue placeholder="Filter by grade" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
                {grades.map(grade => (
                  <SelectItem key={grade} value={grade} className="dark:text-white dark:focus:bg-gray-900">
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 dark:border-pink-400 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading documents...</p>
        </div>
      ) : filteredDocuments.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <Card key={doc._id} className="hover:shadow-lg transition-shadow bg-white dark:bg-black border-gray-200 dark:border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg mb-4">
                    <FileText className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{doc.title}</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className={getSubjectBadge(doc.subject)}>
                      {doc.subject}
                    </Badge>
                    <Badge variant="outline" className="dark:text-gray-300 dark:border-gray-700">{doc.grade}</Badge>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <div>Size: {doc.fileSize}</div>
                    <div>Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
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
          <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left p-4 text-gray-700 dark:text-gray-300">Document</th>
                    <th className="text-left p-4 text-gray-700 dark:text-gray-300">Subject</th>
                    <th className="text-left p-4 text-gray-700 dark:text-gray-300">Grade</th>
                    <th className="text-left p-4 text-gray-700 dark:text-gray-300">Size</th>
                    <th className="text-left p-4 text-gray-700 dark:text-gray-300">Upload Date</th>
                    <th className="text-right p-4 text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc) => (
                    <tr key={doc._id} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/30 rounded flex items-center justify-center">
                            <FileText className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{doc.title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={getSubjectBadge(doc.subject)}>
                          {doc.subject}
                        </Badge>
                      </td>
                      <td className="p-4 text-gray-900 dark:text-white">{doc.grade}</td>
                      <td className="p-4 text-gray-900 dark:text-white">{doc.fileSize}</td>
                      <td className="p-4 text-gray-900 dark:text-white">
                        {new Date(doc.uploadDate).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm"
                            onClick={() => handleDownload(doc)}
                            className="bg-pink-600 hover:bg-pink-700 text-white"
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
        <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Documents Found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {documents.length === 0 
                ? "No documents have been uploaded yet." 
                : "No documents match your search criteria. Try adjusting your filters."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}