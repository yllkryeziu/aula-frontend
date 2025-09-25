// API types and client for educational platform backend

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// API Types
export interface Syllabus {
  id: string;
  name: string;
  description: string | null;
  processing_status: 'created' | 'processing' | 'ready' | 'error';
  document_count: number;
  chapter_count: number;
  chunk_count: number;
  toc_item_count: number;
  last_processed_at: string | null;
  created_at: string;
}

export interface Chapter {
  id: string;
  syllabus_id: string;
  title: string;
  order_index: number;
  is_generated: boolean;
  created_at: string;
  completion_percentage: number;
  subchapters?: Subchapter[];
}

export interface Subchapter {
  id: string;
  chapter_id: string;
  title: string;
  order_index: number;
  text_description: string | null;
  rag_content: string | null;
  subtitles: string | null;
  video_file_path: string | null;
  audio_file_path: string | null;
  video_status: 'queued' | 'generating_script' | 'rendering_video' | 'completed' | 'failed';
  video_progress: number;
  video_message: string | null;
  is_completed: boolean;
  created_at: string;
}

export interface DetailedVideoStatus {
  subchapter_id: string;
  subchapter_title: string;
  video_status: 'queued' | 'generating_script' | 'rendering_video' | 'completed' | 'failed';
  video_progress: number;
  video_message: string | null;
  video_file_path: string | null;
  current_stage: string;
  stage_progress: number;
  stages_completed: string[];
  stages_remaining: string[];
  error_details: string | null;
  started_at: string | null;
  estimated_completion: string | null;
  total_duration_estimate: number | null;
}

export interface Document {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  status: 'uploaded' | 'extracting' | 'chunking' | 'processing' | 'completed' | 'failed';
  chunk_count: number;
  processing_stage?: string;
  progress_percentage?: number;
  estimated_completion?: string;
  processing_completed_at?: string;
  created_at: string;
}

export interface VideoGenerationRequest {
  subchapter_id?: string;
  model?: string;
  voice?: string;
  force_regenerate?: boolean;
}

export interface ChapterVideoStatus {
  chapter_id: string;
  chapter_title: string;
  overall_status: 'completed' | 'generating' | 'queued' | 'failed';
  subchapters: Array<{
    subchapter_id: string;
    title: string;
    video_status: string;
    video_progress: number;
    video_message: string;
    video_file_path: string | null;
  }>;
  progress_summary: {
    completed: number;
    generating: number;
    queued: number;
    failed: number;
    overall_progress: number;
  };
}

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  database: string;
  chromadb: string;
  claude_api: string;
  elevenlabs_api: string;
  embedding_model: string;
  bm25_search: string;
  reranker: string;
  rag_pipeline: string;
  video_generation: string;
  timestamp: string;
}

// API Client
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error ${response.status}: ${error}`);
    }

    return response.json();
  }

  // Syllabus Management
  async createSyllabus(name: string, description: string): Promise<Syllabus> {
    return this.request<Syllabus>('/api/v1/syllabi/', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  async getSyllabi(skip = 0, limit = 20): Promise<Syllabus[]> {
    return this.request<Syllabus[]>(`/api/v1/syllabi/?skip=${skip}&limit=${limit}`);
  }

  async getSyllabus(syllabusId: string): Promise<Syllabus> {
    return this.request<Syllabus>(`/api/v1/syllabi/${syllabusId}`);
  }

  async deleteSyllabus(syllabusId: string): Promise<void> {
    return this.request<void>(`/api/v1/syllabi/${syllabusId}`, {
      method: 'DELETE',
    });
  }

  async generateChapters(
    syllabusId: string,
    options: { max_items?: number; focus_area?: string; depth_level?: number } = {}
  ): Promise<Chapter[]> {
    return this.request<Chapter[]>(`/api/v1/syllabi/${syllabusId}/generate-chapters`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  // Chapter Management
  async getSyllabusChapters(syllabusId: string): Promise<Chapter[]> {
    return this.request<Chapter[]>(`/api/v1/syllabi/${syllabusId}/chapters`);
  }

  async getChapter(chapterId: string): Promise<Chapter> {
    return this.request<Chapter>(`/api/v1/chapters/${chapterId}`);
  }

  async openChapter(
    chapterId: string,
    autoGenerateVideos = true
  ): Promise<{ message: string; chapter_id: string; subchapters_found: number; video_generation_started: boolean; estimated_completion?: string }> {
    return this.request(`/api/v1/chapters/${chapterId}/open?auto_generate_videos=${autoGenerateVideos}`, {
      method: 'POST',
    });
  }

  // Document Management
  async uploadDocument(syllabusId: string, file: File): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/api/v1/syllabi/${syllabusId}/documents`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Upload Error ${response.status}: ${error}`);
    }

    return response.json();
  }

  async getSyllabusDocuments(syllabusId: string, skip = 0, limit = 10): Promise<Document[]> {
    return this.request<Document[]>(`/api/v1/syllabi/${syllabusId}/documents?skip=${skip}&limit=${limit}`);
  }

  async getDocument(documentId: string): Promise<Document> {
    return this.request<Document>(`/api/v1/documents/${documentId}`);
  }

  async deleteDocument(documentId: string): Promise<void> {
    return this.request<void>(`/api/v1/documents/${documentId}`, {
      method: 'DELETE',
    });
  }

  // Video Generation
  async generateSubchapterVideo(
    subchapterId: string,
    options: VideoGenerationRequest = {}
  ): Promise<{ message: string; subchapter_id: string; estimated_duration: string; status: string }> {
    return this.request(`/api/v1/video/subchapters/${subchapterId}/generate-video`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async generateChapterVideos(
    chapterId: string,
    options: VideoGenerationRequest = {}
  ): Promise<{ message: string; chapter_id: string; subchapters_to_process: number; estimated_total_time: string }> {
    return this.request(`/api/v1/video/chapters/${chapterId}/generate-videos`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async getSubchapterVideoStatus(subchapterId: string): Promise<Subchapter> {
    return this.request<Subchapter>(`/api/v1/video/subchapters/${subchapterId}/video-status`);
  }

  async getDetailedVideoStatus(subchapterId: string): Promise<DetailedVideoStatus> {
    return this.request<DetailedVideoStatus>(`/api/v1/video/subchapters/${subchapterId}/detailed-status`);
  }

  async getChapterVideoStatus(chapterId: string): Promise<ChapterVideoStatus> {
    return this.request<ChapterVideoStatus>(`/api/v1/video/chapters/${chapterId}/video-status`);
  }

  async deleteSubchapterVideo(subchapterId: string): Promise<void> {
    return this.request<void>(`/api/v1/video/subchapters/${subchapterId}/video`, {
      method: 'DELETE',
    });
  }

  // Subchapter Access
  async getSubchapter(subchapterId: string): Promise<Subchapter> {
    return this.request<Subchapter>(`/api/v1/subchapters/${subchapterId}`);
  }

  async markSubchapterComplete(subchapterId: string, completed: boolean): Promise<{ subchapter_id: string; is_completed: boolean; message: string }> {
    return this.request(`/api/v1/subchapters/${subchapterId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ completed }),
    });
  }

  // Media Endpoints
  getVideoUrl(subchapterId: string): string {
    return `${this.baseUrl}/api/v1/subchapters/${subchapterId}/video`;
  }

  getAudioUrl(subchapterId: string): string {
    return `${this.baseUrl}/api/v1/subchapters/${subchapterId}/audio`;
  }

  async getSubtitles(subchapterId: string): Promise<{ subchapter_id: string; title: string; subtitles: string; has_subtitles: boolean; word_count: number; estimated_reading_time: string }> {
    return this.request(`/api/v1/subchapters/${subchapterId}/subtitles`);
  }

  async getRagContent(subchapterId: string): Promise<{ subchapter_id: string; title: string; rag_content: string; has_rag_content: boolean; source_documents: string[]; relevance_scores: number[]; retrieval_method: string }> {
    return this.request(`/api/v1/subchapters/${subchapterId}/rag-content`);
  }

  // Health Check
  async getHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>('/health');
  }

  // Search
  async searchSyllabus(syllabusId: string, query: string, maxResults = 10): Promise<{ query: string; results: Array<{ id: string; text: string; source_document: string; relevance_score: number; page_reference: string; section: string }>; total_results: number; search_time_ms: number }> {
    return this.request(`/api/v1/syllabi/${syllabusId}/search`, {
      method: 'POST',
      body: JSON.stringify({ query, max_results: maxResults }),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);