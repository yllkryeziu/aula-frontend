import { useState, useEffect, useCallback } from 'react';
import { apiClient, Syllabus, Chapter, Subchapter, Document, ChapterVideoStatus } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Syllabus hooks
export const useSyllabi = () => {
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSyllabi = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.getSyllabi();
      setSyllabi(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch syllabi';
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
    fetchSyllabi();
  }, [fetchSyllabi]);

  const createSyllabus = async (name: string, description: string) => {
    try {
      const newSyllabus = await apiClient.createSyllabus(name, description);
      setSyllabi(prev => [newSyllabus, ...prev]);
      return newSyllabus;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create syllabus';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteSyllabus = async (syllabusId: string) => {
    try {
      await apiClient.deleteSyllabus(syllabusId);
      setSyllabi(prev => prev.filter(syllabus => syllabus.id !== syllabusId));
      toast({
        title: "Success",
        description: "Syllabus deleted successfully",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete syllabus';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw err;
    }
  };

  return {
    syllabi,
    loading,
    error,
    createSyllabus,
    deleteSyllabus,
    refetch: fetchSyllabi,
  };
};

// Syllabus detail hook
export const useSyllabus = (syllabusId: string) => {
  const [syllabus, setSyllabus] = useState<Syllabus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSyllabus = useCallback(async () => {
    if (!syllabusId) return;

    try {
      setLoading(true);
      const data = await apiClient.getSyllabus(syllabusId);
      setSyllabus(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch syllabus';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [syllabusId, toast]);

  useEffect(() => {
    fetchSyllabus();
  }, [fetchSyllabus]);

  return {
    syllabus,
    loading,
    error,
    refetch: fetchSyllabus,
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
      setSubchapter(prev => prev ? { ...prev, is_completed: completed } : null);
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
      const result = await apiClient.generateSubchapterVideo(subchapterId, {
        subchapter_id: subchapterId
      });
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
export const useDocuments = (syllabusId: string) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDocuments = useCallback(async () => {
    if (!syllabusId) return;

    try {
      setLoading(true);
      const data = await apiClient.getSyllabusDocuments(syllabusId);
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
  }, [syllabusId, toast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const uploadDocument = async (file: File) => {
    try {
      const newDocument = await apiClient.uploadDocument(syllabusId, file);
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