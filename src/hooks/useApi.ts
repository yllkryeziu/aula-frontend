import { useState, useEffect, useCallback } from 'react';
import { apiClient, Course, Chapter, Subchapter, Document, ChapterVideoStatus } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Course hooks
export const useCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.getCourses();
      setCourses(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch courses';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const createCourse = async (name: string, description: string) => {
    try {
      const newCourse = await apiClient.createCourse(name, description);
      setCourses(prev => [newCourse, ...prev]);
      return newCourse;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create course';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteCourse = async (courseId: string) => {
    try {
      await apiClient.deleteCourse(courseId);
      setCourses(prev => prev.filter(course => course.id !== courseId));
      toast({
        title: "Success",
        description: "Course deleted successfully",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete course';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw err;
    }
  };

  return {
    courses,
    loading,
    error,
    createCourse,
    deleteCourse,
    refetch: fetchCourses,
  };
};

// Course detail hook
export const useCourse = (courseId: string) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCourse = useCallback(async () => {
    if (!courseId) return;
    
    try {
      setLoading(true);
      const data = await apiClient.getCourse(courseId);
      setCourse(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch course';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [courseId, toast]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  return {
    course,
    loading,
    error,
    refetch: fetchCourse,
  };
};

// Chapter hook
export const useChapter = (chapterId: string) => {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchChapter = useCallback(async () => {
    if (!chapterId) return;
    
    try {
      setLoading(true);
      const data = await apiClient.getChapter(chapterId);
      setChapter(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch chapter';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [chapterId, toast]);

  useEffect(() => {
    fetchChapter();
  }, [fetchChapter]);

  const openChapter = async (autoGenerateVideos = true) => {
    try {
      const result = await apiClient.openChapter(chapterId, autoGenerateVideos);
      toast({
        title: "Chapter Opened",
        description: result.video_generation_started 
          ? `Video generation started. Estimated completion: ${result.estimated_completion}`
          : "Chapter opened successfully",
      });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to open chapter';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw err;
    }
  };

  return {
    chapter,
    loading,
    error,
    openChapter,
    refetch: fetchChapter,
  };
};

// Subchapter hook
export const useSubchapter = (subchapterId: string) => {
  const [subchapter, setSubchapter] = useState<Subchapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSubchapter = useCallback(async () => {
    if (!subchapterId) return;
    
    try {
      setLoading(true);
      const data = await apiClient.getSubchapter(subchapterId);
      setSubchapter(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch subchapter';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [subchapterId, toast]);

  useEffect(() => {
    fetchSubchapter();
  }, [fetchSubchapter]);

  const markComplete = async (completed: boolean) => {
    try {
      const result = await apiClient.markSubchapterComplete(subchapterId, completed);
      setSubchapter(prev => prev ? { ...prev, completion_status: completed } : null);
      toast({
        title: "Progress Updated",
        description: result.message,
      });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update completion status';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw err;
    }
  };

  const generateVideo = async () => {
    try {
      const result = await apiClient.generateSubchapterVideo(subchapterId);
      toast({
        title: "Video Generation Started",
        description: `Estimated duration: ${result.estimated_duration}`,
      });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate video';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw err;
    }
  };

  return {
    subchapter,
    loading,
    error,
    markComplete,
    generateVideo,
    refetch: fetchSubchapter,
  };
};

// Video status polling hook
export const useVideoStatusPolling = (chapterId: string, enabled = false, interval = 15000) => {
  const [status, setStatus] = useState<ChapterVideoStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!chapterId || !enabled) return;
    
    try {
      setLoading(true);
      const data = await apiClient.getChapterVideoStatus(chapterId);
      setStatus(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch video status';
      setError(message);
      console.error('Video status polling error:', message);
    } finally {
      setLoading(false);
    }
  }, [chapterId, enabled]);

  useEffect(() => {
    if (!enabled) {
      setStatus(null);
      return;
    }

    fetchStatus();
    const pollInterval = setInterval(fetchStatus, interval);

    return () => clearInterval(pollInterval);
  }, [fetchStatus, enabled, interval]);

  return {
    status,
    loading,
    error,
    refetch: fetchStatus,
  };
};

// Documents hook
export const useDocuments = (courseId: string) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDocuments = useCallback(async () => {
    if (!courseId) return;
    
    try {
      setLoading(true);
      const data = await apiClient.getCourseDocuments(courseId);
      setDocuments(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch documents';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [courseId, toast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const uploadDocument = async (file: File) => {
    try {
      const newDocument = await apiClient.uploadDocument(courseId, file);
      setDocuments(prev => [newDocument, ...prev]);
      toast({
        title: "Upload Started",
        description: `${file.name} is being processed. This may take a few minutes.`,
      });
      return newDocument;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload document';
      toast({
        title: "Upload Error",
        description: message,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      await apiClient.deleteDocument(documentId);
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete document';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw err;
    }
  };

  return {
    documents,
    loading,
    error,
    uploadDocument,
    deleteDocument,
    refetch: fetchDocuments,
  };
};