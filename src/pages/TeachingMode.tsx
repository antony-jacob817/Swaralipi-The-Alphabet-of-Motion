import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FileText, Download, ExternalLink, Play, Pause, SkipForward, SkipBack, MessageSquare, ArrowLeft } from 'lucide-react';
import { SignAvatar2D } from "@/components/avatar/SignAvatar2D";
import { DoubtRecorder } from "@/components/doubt/DoubtRecorder";

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
  "each", "every", "most", "none", "enough", "little", "please", "thank", 
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
  
  const [currentWord, setCurrentWord] = useState<string>('');
  const [wordIndex, setWordIndex] = useState<number>(0);
  const [words, setWords] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  
  // Doubt Answer states
  const [showDoubtRecorder, setShowDoubtRecorder] = useState(false);
  const [doubtQuestion, setDoubtQuestion] = useState("");
  const [doubtGlossWords, setDoubtGlossWords] = useState<string[]>([]);
  const [doubtNormalText, setDoubtNormalText] = useState("");
  const [isAnsweringDoubt, setIsAnsweringDoubt] = useState(false);
  const [isFetchingDoubt, setIsFetchingDoubt] = useState(false);

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

    fetchSubjects();
  }, []);

  const selectedSubjectData = subjects.find(s => s._id === selectedSubject);
  const selectedChapterData = selectedSubjectData?.chapters.find(c => c._id === selectedChapter);

  const fetchPdfTextForSigning = useCallback(async () => {
    if (!selectedChapterData) return;
    
    try {
      setContentLoading(true);
      const response = await fetch(`http://localhost:5000/api/pdf-text/${selectedChapterData.pdfId}`);
      const data = await response.json();
      
      if (response.ok && data.success && data.text) {
        const wordList = data.text
          .split(/\s+/)
          .map((word: string) => word.replace(/[^\w]/g, '').toLowerCase())
          .filter((word: string) => word.length > 0)
          .filter((word: string) => !FILTERED_WORDS.includes(word));
        
        // BUG FIX: Removed 'new Set()' so duplicate words are no longer deleted.
        // It now keeps the natural flow of the paragraph up to 100 words.
        const finalWords = wordList.slice(0, 100) as string[];
        
        setWords(finalWords);
      } else {
        setWords([]);
      }
    } catch (err) {
      console.error('Error fetching PDF text for signing:', err);
      setWords([]);
    } finally {
      setContentLoading(false);
    }
  }, [selectedChapterData]);

  useEffect(() => {
    if (selectedChapterData && selectedChapterData.pdfId) {
      setPdfUrl(`http://localhost:5000/api/pdf/${selectedChapterData.pdfId}`);
      fetchPdfTextForSigning();
    } else {
      setPdfUrl('');
      setWords([]);
    }
  }, [selectedChapterData, fetchPdfTextForSigning]);

  // Handle advancing to the next word
  const handleSignComplete = useCallback(() => {
    if (isPaused) return;

    if (isAnsweringDoubt) {
      setWordIndex(prev => {
        const next = prev + 1;

        if (next < doubtGlossWords.length) {
          setCurrentWord(doubtGlossWords[next]);
          return next;
        } else {
          setIsAnsweringDoubt(false);
          return 0;
        }
      });
    } else if (isTeaching) {
      setWordIndex(prev => {
        const next = prev + 1;

        if (next < words.length) {
          setCurrentWord(words[next]);
          return next;
        } else {
          setIsTeaching(false);
          setCurrentWord('');
          return 0;
        }
      });
    }
  }, [isPaused, isAnsweringDoubt, doubtGlossWords, isTeaching, words]);

  const startTeaching = () => {
    if (!selectedChapterData) {
      alert('Please select a chapter first');
      return;
    }
    if (words.length === 0) {
      alert('No signable words found in this PDF.');
      return;
    }
    
    setIsTeaching(true);
    setIsPaused(false);
    setIsAnsweringDoubt(false);
    setWordIndex(0);
    setCurrentWord(words[0]);
  };

  const stopTeaching = () => {
    setIsTeaching(false);
    setIsPaused(false);
    setCurrentWord('');
    setWordIndex(0);

    // ADD THIS
    setIsAnsweringDoubt(false);
    setDoubtGlossWords([]);
  };

  const pauseTeaching = () => setIsPaused(true);
  const resumeTeaching = () => setIsPaused(false);

  const nextWord = () => {
    if (isAnsweringDoubt) {
      if (wordIndex < doubtGlossWords.length - 1) {
        const newIndex = wordIndex + 1;
        setWordIndex(newIndex);
        setCurrentWord(doubtGlossWords[newIndex]);
      }
    } else {
      if (wordIndex < words.length - 1) {
        const newIndex = wordIndex + 1;
        setWordIndex(newIndex);
        setCurrentWord(words[newIndex]);
      }
    }
  };

  const previousWord = () => {
    if (isAnsweringDoubt) {
      if (wordIndex > 0) {
        const newIndex = wordIndex - 1;
        setWordIndex(newIndex);
        setCurrentWord(doubtGlossWords[newIndex]);
      }
    } else {
      if (wordIndex > 0) {
        const newIndex = wordIndex - 1;
        setWordIndex(newIndex);
        setCurrentWord(words[newIndex]);
      }
    }
  };

  // Doubt Handlers
  const handleAskDoubt = () => {
    setIsPaused(true);
    setShowDoubtRecorder(true);
  };

  const handleDoubtSubmitted = async (doubtText: string) => {
  setDoubtQuestion(doubtText);
  setShowDoubtRecorder(false);
  setIsFetchingDoubt(true);

  try {
    const response = await fetch('http://localhost:5000/api/doubt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: doubtText })
    });

    const data = await response.json();

    // 🔥 NEW STRUCTURE
    setDoubtNormalText(data.answer);

    const words = data.gloss?.trim().split(" ") || [];

    setDoubtGlossWords(words);
    setIsAnsweringDoubt(true);

    // Start animation
    setWordIndex(0);
    setCurrentWord(words[0]);

    setIsPaused(false);

  } catch (error) {
    console.error('Failed to get doubt answer', error);
  } finally {
    setIsFetchingDoubt(false);
  }
};

  const clearDoubt = () => {
    setDoubtQuestion("");
    setDoubtGlossWords([]);
    setDoubtNormalText("");
    setIsAnsweringDoubt(false);
    setIsPaused(true);
    if (words.length > 0) {
      setCurrentWord(words[wordIndex]);
    }
  };

  // PDF Actions
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
    clearDoubt();
  };

  // Rendering
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 dark:border-pink-400 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading teaching materials...</p>
        </div>
      </div>
    );
  }

  if (showDoubtRecorder) {
    return (
      <div className="space-y-6 p-6">
        <Button onClick={() => setShowDoubtRecorder(false)} variant="outline" className="flex items-center gap-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300">
          <ArrowLeft className="h-4 w-4" /> Back to Teaching
        </Button>
        <DoubtRecorder onDoubtSubmitted={handleDoubtSubmitted} onClose={() => setShowDoubtRecorder(false)} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">            
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ISL Teaching Mode</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Learn with Indian Sign Language interpreter using canonical signing data</p>
        </div>
        {selectedChapterData && (
          <Badge variant="outline" className="text-sm dark:text-gray-300 dark:border-gray-700">
            {selectedSubjectData?.name} - {selectedChapterData.name}
          </Badge>
        )}
      </div>

      {!selectedChapter && (
        <Card className="mb-6 bg-white dark:bg-black border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <BookOpen className="h-5 w-5" /> Select Learning Material
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Choose a subject and chapter to begin learning with ISL signs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
                <Select value={selectedSubject} onValueChange={(value) => {
                  setSelectedSubject(value);
                  setSelectedChapter('');
                  stopTeaching();
                }}>
                  <SelectTrigger className="bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
                    <SelectValue placeholder="Choose a Subject" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
                    {subjects.map((subject) => (
                      <SelectItem key={subject._id} value={subject._id} className="dark:text-white dark:focus:bg-gray-900">
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedSubject && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Chapter</label>
                  <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                    <SelectTrigger className="bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
                      {selectedSubjectData?.chapters.map((chapter) => (
                        <SelectItem key={chapter._id} value={chapter._id} className="dark:text-white dark:focus:bg-gray-900">
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
            <SignAvatar2D 
              word={currentWord} 
              onSignComplete={handleSignComplete}
              paused={isPaused}
            />
            
            {/* Teaching Controls */}
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  {!isTeaching && !isAnsweringDoubt ? (
                    <div className="flex gap-2">
                       <Button 
                         onClick={startTeaching} 
                         className="flex items-center gap-2 flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                         disabled={contentLoading || words.length === 0}
                       >
                         <Play className="h-4 w-4" /> 
                         {contentLoading ? 'Loading Content...' : words.length === 0 ? 'No Signable Words' : 'Start ISL Teaching'}
                       </Button>
                       <Button
                         variant="outline"
                         onClick={handleAskDoubt}
                         className="flex items-center gap-2 flex-1 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                       >
                         <MessageSquare className="h-4 w-4" /> Ask Doubt
                       </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      {isPaused ? (
                        <Button onClick={resumeTeaching} className="flex items-center gap-2 flex-1 bg-pink-600 hover:bg-pink-700 text-white">
                          <Play className="h-4 w-4" /> Resume
                        </Button>
                      ) : (
                        <Button onClick={pauseTeaching} variant="outline" className="flex items-center gap-2 flex-1 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                          <Pause className="h-4 w-4" /> Pause
                        </Button>
                      )}
                      <Button onClick={stopTeaching} variant="secondary" className="dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">Stop</Button>
                      <Button variant="outline" onClick={handleAskDoubt} className="flex items-center gap-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                        <MessageSquare className="h-4 w-4" /> Ask Doubt
                      </Button>
                    </div>
                  )}

                  {/* Skip Controls (Disabled if answering doubt) */}
                  {(isTeaching || isAnsweringDoubt) && (
                    <div className="flex justify-between items-center mt-2">
                      <Button variant="outline" size="sm" onClick={previousWord} disabled={wordIndex === 0} className="dark:border-gray-700 dark:text-gray-300">
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      
                      <div className="text-center">
                        <Badge variant="secondary" className="dark:bg-gray-800 dark:text-gray-300">
                          Word {wordIndex + 1} of {words.length}
                        </Badge>
                      </div>
                      
                      <Button variant="outline" size="sm" onClick={nextWord} disabled={wordIndex >= words.length - 1} className="dark:border-gray-700 dark:text-gray-300">
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Doubt Fetching State */}
            {isFetchingDoubt && (
              <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 dark:border-yellow-400"></div>
                  <span className="text-yellow-800 dark:text-yellow-300 font-medium">Generating ISL response from AI...</span>
                </CardContent>
              </Card>
            )}

            {/* Doubt Answer Display */}
            {(isAnsweringDoubt || doubtNormalText) && (
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-green-800 dark:text-green-300">Doubt Answer:</h4>
                    <Button size="sm" variant="ghost" onClick={clearDoubt} className="h-6 px-2 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800">
                      Close
                    </Button>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400 mb-1"><strong>Q:</strong> {doubtQuestion}</p>
                  <p className="text-sm text-green-800 dark:text-green-300 mb-3 font-bold uppercase tracking-wide"><strong>A:</strong> {doubtGlossWords.join(' ')}</p>
                  <div className="bg-white dark:bg-black p-3 rounded border border-green-100 dark:border-green-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Current Sign (Gloss):</p>
                    <p className="text-xl font-bold text-green-700 dark:text-green-400">{currentWord}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current Word Display (Normal Teaching) */}
            {isTeaching && !isAnsweringDoubt && currentWord && (
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Currently Teaching:</h4>
                  <p className="text-blue-700 dark:text-blue-400 text-2xl font-bold text-center py-2 uppercase tracking-wider">"{currentWord}"</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - PDF Viewer */}
          <div className="space-y-4">
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-gray-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    PDF Document
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleViewPDF} className="dark:border-gray-700 dark:text-gray-300">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      New Tab
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="dark:border-gray-700 dark:text-gray-300">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {selectedSubjectData?.name} - {selectedChapterData.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* PDF Display Area */}
                <div className="h-[500px] border-2 border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-900 flex flex-col">
                  {pdfUrl ? (
                    <>
                      <div className="flex items-center justify-between p-3 bg-gray-200 dark:bg-gray-800 border-b dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          PDF Viewer - {selectedChapterData.name}
                        </span>
                        {(isTeaching || isAnsweringDoubt) && (
                          <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">Teaching: {currentWord || 'Ready'}</Badge>
                        )}
                        {isAnsweringDoubt && (
                          <Badge className="bg-green-600 dark:bg-green-700">Answering Doubt</Badge>
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
                        <FileText className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">PDF loading...</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* PDF Actions */}
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" className="flex-1 dark:border-gray-700 dark:text-gray-300" onClick={handleViewPDF}>
                    <ExternalLink className="h-4 w-4 mr-2" /> Open in New Tab
                  </Button>
                  <Button variant="outline" className="flex-1 dark:border-gray-700 dark:text-gray-300" onClick={handleDownloadPDF}>
                    <Download className="h-4 w-4 mr-2" /> Download PDF
                  </Button>
                  <Button variant="secondary" onClick={clearSelection} className="dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">
                    Change Chapter
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
          <CardContent className="p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Ready for ISL Learning</h3>
            <p className="text-gray-600 dark:text-gray-400">Select a subject and chapter above to begin learning with Indian Sign Language using canonical sign data.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}