// TeachingMode.tsx - WITH CANONICAL.JSON SIGNING COORDINATES
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FileText, Download, ExternalLink, Play, Pause, SkipForward, SkipBack, AlertCircle } from 'lucide-react';
import { AvatarAnimation } from '@/components/avatar/AvatarAnimation';

interface Subject {
  _id: string;
  name: string;
  chapters: Chapter[];
}

interface Chapter {
  _id: string;
  name: string;
  pdfId: string;
}

interface SignData {
  word: string;
  pose: number[];
  left_hand: number[];
  right_hand: number[];
}

// Words to filter out (no signs available)
const FILTERED_WORDS = [
  "a", "an", "the", "is", "am", "are", "was", "were", "be", "been", "being", 
  "have", "has", "had", "do", "does", "did", "will", "shall", "would", "should", 
  "can", "could", "may", "might", "must", "in", "on", "at", "by", "for", "to", 
  "with", "from", "of", "about", "over", "under", "into", "onto", "above", "below", 
  "near", "next", "between", "and", "but", "or", "nor", "yet", "so", "although", 
  "because", "since", "unless", "while", "whereas", "though", "he", "she", "it", 
  "they", "him", "her", "them", "himself", "herself", "itself", "themselves", 
  "that", "which", "who", "whom", "whose", "what", "when", "where", "how", "why", 
  "whether", "whichever", "whoever", "some", "any", "many", "few", "several", 
  "each", "every", "all", "most", "none", "enough", "little", "please", "thank", 
  "sorry", "excuse", "okay", "well", "actually", "just", "really", "very", "about", 
  "also", "again", "already", "even", "still", "only", "too", "maybe"
];

export function TeachingMode() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [isTeaching, setIsTeaching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [contentLoading, setContentLoading] = useState(false);
  const [signData, setSignData] = useState<SignData[]>([]);
  
  const [currentWord, setCurrentWord] = useState<string>('');
  const [wordIndex, setWordIndex] = useState<number>(0);
  const [words, setWords] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [availableSigns, setAvailableSigns] = useState<string[]>([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/subjects');
        if (!response.ok) throw new Error('Failed to fetch subjects');
        const data = await response.json();
        setSubjects(data);
      } catch (err) {
        console.error('Error fetching subjects:', err);
      } finally {
        setLoading(false);
      }
    };

    // Load sign data from canonical.json
    const loadSignData = async () => {
      try {
        const response = await fetch('/canonical.json');
        const data: SignData[] = await response.json();
        setSignData(data);
        setAvailableSigns(data.map(sign => sign.word.toLowerCase()));
        console.log('Loaded sign data for words:', data.length);
      } catch (err) {
        console.error('Error loading canonical.json:', err);
      }
    };

    fetchSubjects();
    loadSignData();
  }, []);

  const selectedSubjectData = subjects.find(s => s._id === selectedSubject);
  const selectedChapterData = selectedSubjectData?.chapters.find(c => c._id === selectedChapter);

  // Memoize fetchPdfTextForSigning to avoid unnecessary re-creations
  const fetchPdfTextForSigning = useCallback(async () => {
    if (!selectedChapterData) return;
    
    try {
      setContentLoading(true);
      const response = await fetch(`http://localhost:5000/api/pdf-text/${selectedChapterData.pdfId}`);
      const data = await response.json();
      
      if (response.ok && data.success && data.text) {
        // Extract words for signing and filter
        const wordList = data.text
          .split(/\s+/)
          .map((word: string) => word.replace(/[^\w]/g, '').toLowerCase())
          .filter((word: string) => word.length > 0)
          .filter((word: string) => !FILTERED_WORDS.includes(word)) // Filter out words without signs
          .filter((word: string) => availableSigns.includes(word)); // Only include words with signs
        
        // Remove duplicates and limit to reasonable number
        const uniqueWords = Array.from(new Set(wordList)).slice(0, 100) as string[];
        
        setWords(uniqueWords);
        console.log('Filtered words for signing:', uniqueWords.length, uniqueWords);
      } else {
        setWords([]);
      }
    } catch (err) {
      console.error('Error fetching PDF text for signing:', err);
      setWords([]);
    } finally {
      setContentLoading(false);
    }
  }, [selectedChapterData, availableSigns]);

  useEffect(() => {
    if (selectedChapterData && selectedChapterData.pdfId) {
      // Set the PDF URL for iframe display
      const pdfViewerUrl = `http://localhost:5000/api/pdf/${selectedChapterData.pdfId}`;
      setPdfUrl(pdfViewerUrl);
      
      // Fetch text for avatar signing
      fetchPdfTextForSigning();
    } else {
      setPdfUrl('');
      setWords([]);
    }
  }, [selectedChapterData, fetchPdfTextForSigning]);

  // (Removed duplicate fetchPdfTextForSigning definition)

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTeaching && !isPaused && words.length > 0) {
      interval = setInterval(() => {
        setWordIndex(prevIndex => {
          const nextIndex = prevIndex + 1;
          
          if (nextIndex >= words.length) {
            setIsTeaching(false);
            setCurrentWord('');
            return 0;
          }
          
          setCurrentWord(words[nextIndex]);
          return nextIndex;
        });
      }, 3000); // 3 seconds per word
    }
    
    return () => clearInterval(interval);
  }, [isTeaching, isPaused, words]);

  const startTeaching = () => {
    if (!selectedChapterData) {
      alert('Please select a chapter first');
      return;
    }
    
    if (words.length === 0) {
      alert('No signable words found in this PDF. The PDF might not contain words with available ISL signs.');
      return;
    }
    
    setIsTeaching(true);
    setIsPaused(false);
    setWordIndex(0);
    setCurrentWord(words[0]);
  };

  const pauseTeaching = () => {
    setIsPaused(true);
  };

  const resumeTeaching = () => {
    setIsPaused(false);
  };

  const stopTeaching = () => {
    setIsTeaching(false);
    setIsPaused(false);
    setCurrentWord('');
    setWordIndex(0);
  };

  const nextWord = () => {
    if (wordIndex < words.length - 1) {
      const newIndex = wordIndex + 1;
      setWordIndex(newIndex);
      setCurrentWord(words[newIndex]);
    }
  };

  const previousWord = () => {
    if (wordIndex > 0) {
      const newIndex = wordIndex - 1;
      setWordIndex(newIndex);
      setCurrentWord(words[newIndex]);
    }
  };

  const handleViewPDF = () => {
    if (selectedChapterData) {
      window.open(`http://localhost:5000/api/pdf/${selectedChapterData.pdfId}`, '_blank');
    }
  };

  const handleDownloadPDF = () => {
    if (selectedChapterData) {
      const downloadUrl = `http://localhost:5000/api/pdf/${selectedChapterData.pdfId}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${selectedChapterData.name}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const clearSelection = () => {
    setSelectedChapter('');
    setSelectedSubject('');
    setPdfUrl('');
    setWords([]);
    stopTeaching();
  };

  // Get current sign data for the current word
  const getCurrentSignData = () => {
    if (!currentWord) return null;
    return signData.find(sign => sign.word.toLowerCase() === currentWord.toLowerCase());
  };

  const currentSignData = getCurrentSignData();

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading teaching materials...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ISL Teaching Mode</h1>
              <p className="text-gray-600 mt-1">Learn with Indian Sign Language interpreter using canonical signing data</p>
            </div>
            {selectedChapterData && (
              <Badge variant="outline" className="text-sm">
                {selectedSubjectData?.name} - {selectedChapterData.name}
              </Badge>
            )}
          </div>

          {!selectedChapter && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" /> Select Learning Material
                </CardTitle>
                <CardDescription>Choose a subject and chapter to begin learning with ISL signs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Subject</label>
                    <Select value={selectedSubject} onValueChange={(value) => {
                      setSelectedSubject(value);
                      setSelectedChapter('');
                      stopTeaching();
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject._id} value={subject._id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedSubject && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Chapter</label>
                      <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a chapter" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedSubjectData?.chapters.map((chapter) => (
                            <SelectItem key={chapter._id} value={chapter._id}>
                              {chapter.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {selectedChapterData ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Left Column - Avatar and Controls */}
              <div className="space-y-4">
                <AvatarAnimation 
                  isTeaching={isTeaching} 
                  currentWord={currentWord}
                  signData={currentSignData}  // Add this line
                />
                
                {/* Teaching Controls */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3">
                      {!isTeaching ? (
                        <Button 
                          onClick={startTeaching} 
                          className="flex items-center gap-2"
                          disabled={contentLoading || words.length === 0}
                        >
                          <Play className="h-4 w-4" /> 
                          {contentLoading ? 'Loading Content...' : 
                           words.length === 0 ? 'No Signable Words' : 'Start ISL Teaching'}
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          {isPaused ? (
                            <Button onClick={resumeTeaching} className="flex items-center gap-2 flex-1">
                              <Play className="h-4 w-4" /> Resume
                            </Button>
                          ) : (
                            <Button onClick={pauseTeaching} variant="outline" className="flex items-center gap-2 flex-1">
                              <Pause className="h-4 w-4" /> Pause
                            </Button>
                          )}
                          <Button onClick={stopTeaching} variant="secondary">
                            Stop
                          </Button>
                        </div>
                      )}
                      
                      {isTeaching && (
                        <div className="flex justify-between items-center">
                          <Button variant="outline" size="sm" onClick={previousWord} disabled={wordIndex === 0}>
                            <SkipBack className="h-4 w-4" />
                          </Button>
                          
                          <div className="text-center">
                            <Badge variant="secondary">
                              Word {wordIndex + 1} of {words.length}
                            </Badge>
                          </div>
                          
                          <Button variant="outline" size="sm" onClick={nextWord} disabled={wordIndex >= words.length - 1}>
                            <SkipForward className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Current Word Display */}
                {isTeaching && currentWord && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">Currently Teaching:</h4>
                      <p className="text-blue-700 text-lg font-bold">"{currentWord}"</p>
                      <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                        <div>
                          <span className="text-blue-600">Progress:</span> {wordIndex + 1}/{words.length}
                        </div>
                        <div>
                          <span className="text-blue-600">Sign Data:</span> 
                          <Badge variant={currentSignData ? "default" : "secondary"} className="ml-2">
                            {currentSignData ? 'Available' : 'Not Found'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Sign Information */}
                {currentSignData && (
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-green-800 mb-2">Sign Information</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-green-600">Pose Points:</span> {currentSignData.pose.length}
                        </div>
                        <div>
                          <span className="text-green-600">Left Hand:</span> {currentSignData.left_hand.length} points
                        </div>
                        <div>
                          <span className="text-green-600">Right Hand:</span> {currentSignData.right_hand.length} points
                        </div>
                        <div>
                          <span className="text-green-600">Status:</span> 
                          <Badge variant="default" className="ml-2">Active</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Chapter Info */}
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Teaching Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subject:</span>
                        <span className="font-medium">{selectedSubjectData?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Chapter:</span>
                        <span className="font-medium">{selectedChapterData.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Signable Words:</span>
                        <Badge variant={words.length > 0 ? "default" : "secondary"}>
                          {words.length} words
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Signs:</span>
                        <Badge variant="outline">{availableSigns.length} signs</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - PDF Viewer */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        PDF Document
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleViewPDF}>
                          <ExternalLink className="h-4 w-4 mr-1" />
                          New Tab
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      {selectedSubjectData?.name} - {selectedChapterData.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* PDF Display Area */}
                    <div className="h-[500px] border-2 border-gray-300 rounded-lg bg-gray-100 flex flex-col">
                      {pdfUrl ? (
                        <>
                          <div className="flex items-center justify-between p-3 bg-gray-200 border-b">
                            <span className="text-sm font-medium text-gray-700">
                              PDF Viewer - {selectedChapterData.name}
                            </span>
                            {isTeaching && (
                              <Badge variant="secondary">Teaching: {currentWord || 'Ready'}</Badge>
                            )}
                          </div>
                          <div className="flex-1">
                            <iframe 
                              src={pdfUrl}
                              className="w-full h-full"
                              title={`PDF: ${selectedChapterData.name}`}
                              style={{ border: 'none' }}
                            />
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600">PDF loading...</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* PDF Actions */}
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" className="flex-1" onClick={handleViewPDF}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open in New Tab
                      </Button>
                      <Button variant="outline" className="flex-1" onClick={handleDownloadPDF}>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                      <Button variant="secondary" onClick={clearSelection}>
                        Change Chapter
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Sign Library Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Sign Library Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Signs Available:</span>
                        <Badge>{availableSigns.length}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Words Filtered Out:</span>
                        <Badge variant="outline">{FILTERED_WORDS.length}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Chapter Words:</span>
                        <Badge variant={words.length > 0 ? "default" : "secondary"}>
                          {words.length} signable
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-3 p-2 bg-yellow-50 rounded text-xs">
                      <strong>Note:</strong> Only words with available ISL signs are used for teaching. 
                      Common words like "the", "is", "and" are filtered out.
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready for ISL Learning</h3>
                <p className="text-gray-600">Select a subject and chapter above to begin learning with Indian Sign Language using canonical sign data.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}