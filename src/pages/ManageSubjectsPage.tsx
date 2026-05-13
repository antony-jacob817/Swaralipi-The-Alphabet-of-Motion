import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Loader2, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Subject {
  _id: string;
  name: string;
  chapters: Chapter[];
}

interface Chapter {
  name: string;
  source: string;
  pdfId: string;
  fileName: string;
  uploadDate: string;
}

export function ManageSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [newSubjectName, setNewSubjectName] = useState<string>('');
  const [chapterName, setChapterName] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [mode, setMode] = useState<'add-subject' | 'add-chapter' | 'edit-subject' | 'edit-chapter'>('add-subject');
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editingChapterIndex, setEditingChapterIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await fetch('https://antonyjacob817-swaralipi-api.hf.space/api/subjects');
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && e.target.files[0].type === 'application/pdf') {
      setPdfFile(e.target.files[0]);
      setMessage('');
    } else {
      setPdfFile(null);
      setMessage('Please select a PDF file.');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');

    if (mode === 'add-subject') {
      if (!newSubjectName || !chapterName || !source || !pdfFile) {
        setMessage('Please fill out all fields and select a PDF file.');
        return;
      }
    } else if (mode === 'add-chapter') {
      if (!selectedSubject || !chapterName || !source || !pdfFile) {
        setMessage('Please fill out all fields and select a PDF file.');
        return;
      }
    } else if (mode === 'edit-subject') {
      if (!editingSubjectId || !newSubjectName) {
        setMessage('Please fill out all fields.');
        return;
      }
    } else if (mode === 'edit-chapter') {
      if (!editingSubjectId || editingChapterIndex === null || !chapterName || !source) {
        setMessage('Please fill out all fields.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'edit-subject') {
        // Edit subject name
        const response = await fetch(`https://antonyjacob817-swaralipi-api.hf.space/api/subjects/${editingSubjectId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newSubjectName
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update subject.');
        }

        setMessage('Subject updated successfully! ✅');
        resetEditMode();

      } else if (mode === 'edit-chapter') {
        // Edit chapter
        const formData = new FormData();
        formData.append('chapterName', chapterName);
        formData.append('source', source);
        if (pdfFile) {
          formData.append('pdf', pdfFile);
        }

        const response = await fetch(`https://antonyjacob817-swaralipi-api.hf.space/api/subjects/${editingSubjectId}/chapters/${editingChapterIndex}`, {
          method: 'PUT',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update chapter.');
        }

        setMessage('Chapter updated successfully! ✅');
        resetEditMode();

      } else {
        // Add new subject or chapter (original functionality)
        const formData = new FormData();
        
        if (mode === 'add-subject') {
          formData.append('subjectName', newSubjectName);
        } else {
          formData.append('subjectId', selectedSubject);
        }
        
        formData.append('chapterName', chapterName);
        formData.append('source', source);
        if (pdfFile) {
          formData.append('pdf', pdfFile);
        }

        const url = mode === 'add-subject' 
          ? 'https://antonyjacob817-swaralipi-api.hf.space/api/subjects'
          : `https://antonyjacob817-swaralipi-api.hf.space/api/subjects/${selectedSubject}/chapters`;
        
        const response = await fetch(url, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to upload.');
        }

        const result = await response.json();
        setMessage(result.message || 'Upload successful! ✅');
      }

      // Reset form
      setNewSubjectName('');
      setChapterName('');
      setSource('');
      setPdfFile(null);
      setSelectedSubject('');
      (document.getElementById('pdf-upload') as HTMLInputElement).value = '';

      // Refresh subjects list
      fetchSubjects();

    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(`Error: ${error.message} ❌`);
      } else {
        setMessage('An unknown error occurred ❌');
      }
    } finally {
      setLoading(false);
    }
  };

  const startEditSubject = (subjectId: string, subjectName: string) => {
    setEditingSubjectId(subjectId);
    setNewSubjectName(subjectName);
    setMode('edit-subject');
    setMessage('');
  };

  const startEditChapter = (subjectId: string, chapterIndex: number, chapter: Chapter) => {
    setEditingSubjectId(subjectId);
    setEditingChapterIndex(chapterIndex);
    setChapterName(chapter.name);
    setSource(chapter.source);
    setMode('edit-chapter');
    setMessage('');
  };

  const resetEditMode = () => {
    setEditingSubjectId(null);
    setEditingChapterIndex(null);
    setMode('add-subject');
    setNewSubjectName('');
    setChapterName('');
    setSource('');
    setPdfFile(null);
  };

  const deleteSubject = async (subjectId: string) => {
    if (!confirm('Are you sure you want to delete this subject? All chapters will be deleted.')) {
      return;
    }

    try {
      const response = await fetch(`https://antonyjacob817-swaralipi-api.hf.space/api/subjects/${subjectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete subject.');
      }

      setMessage('Subject deleted successfully! ✅');
      fetchSubjects();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(`Error: ${error.message} ❌`);
      } else {
        setMessage('An unknown error occurred ❌');
      }
    }
  };

  const getButtonText = () => {
    switch (mode) {
      case 'add-subject':
        return 'Add Subject & Chapter';
      case 'add-chapter':
        return 'Add Chapter';
      case 'edit-subject':
        return 'Update Subject';
      case 'edit-chapter':
        return 'Update Chapter';
      default:
        return 'Submit';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manage Subjects & Chapters</h1>
        <Button asChild>
          <Link to="/admin">
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add/Edit Section */}
        <Card>
          <CardHeader>
            <CardTitle>
              {mode.startsWith('edit') ? 'Edit Content' : 'Add New Content'}
            </CardTitle>
            <CardDescription>
              {mode.startsWith('edit') 
                ? 'Edit existing subject or chapter details.' 
                : 'Add a new subject or chapter with PDF study material.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mode.startsWith('edit') ? (
              <div className="flex gap-2 mb-4">
                <Button
                  variant="outline"
                  onClick={resetEditMode}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel Edit
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 mb-4">
                <Button
                  variant={mode === 'add-subject' ? 'default' : 'outline'}
                  onClick={() => setMode('add-subject')}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Subject
                </Button>
                <Button
                  variant={mode === 'add-chapter' ? 'default' : 'outline'}
                  onClick={() => setMode('add-chapter')}
                  className="flex-1"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Add Chapter
                </Button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {(mode === 'add-subject' || mode === 'edit-subject') ? (
                <div className="space-y-2">
                  <Label htmlFor="subjectName">Subject Name</Label>
                  <Input
                    id="subjectName"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    placeholder="e.g., Mathematics"
                  />
                </div>
              ) : (mode === 'add-chapter' || mode === 'edit-chapter') ? (
                <div className="space-y-2">
                  <Label htmlFor="subjectSelect">
                    {mode === 'edit-chapter' ? 'Subject (Cannot be changed)' : 'Select Subject'}
                  </Label>
                  {mode === 'edit-chapter' ? (
                    <Input
                      value={subjects.find(s => s._id === editingSubjectId)?.name || ''}
                      disabled
                    />
                  ) : (
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject._id} value={subject._id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ) : null}

              {(mode === 'add-subject' || mode === 'add-chapter' || mode === 'edit-chapter') && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="chapterName">Chapter Name</Label>
                    <Input
                      id="chapterName"
                      value={chapterName}
                      onChange={(e) => setChapterName(e.target.value)}
                      placeholder="e.g., Algebra"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="source">Source</Label>
                    <Input
                      id="source"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      placeholder="e.g., NCERT Class 10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pdf-upload">
                      Upload PDF {mode === 'edit-chapter' && '(Leave empty to keep current file)'}
                    </Label>
                    <Input
                      id="pdf-upload"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                    />
                  </div>
                </>
              )}

              {message && (
                <div className={`p-4 rounded-md ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {message}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {mode.startsWith('edit') ? 'Updating...' : 'Uploading...'}
                  </>
                ) : (
                  <>
                    {mode.startsWith('edit') ? (
                      <Save className="h-4 w-4 mr-2" />
                    ) : (
                      <BookOpen className="h-4 w-4 mr-2" />
                    )}
                    {getButtonText()}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Subjects List */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Subjects</CardTitle>
            <CardDescription>All subjects available in the system</CardDescription>
          </CardHeader>
          <CardContent>
            {subjects.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No subjects added yet.</p>
            ) : (
              <div className="space-y-4">
                {subjects.map((subject) => (
                  <div key={subject._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{subject.name}</h3>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditSubject(subject._id, subject.name)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteSubject(subject._id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {subject.chapters.length} chapter{subject.chapters.length !== 1 ? 's' : ''}
                    </p>
                    <div className="space-y-2">
                      {subject.chapters.map((chapter, index) => (
                        <div key={index} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium">{chapter.name}</span>
                            <span className="text-gray-500 ml-2">- {chapter.source}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => startEditChapter(subject._id, index, chapter)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}