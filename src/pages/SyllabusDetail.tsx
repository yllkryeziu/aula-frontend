import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare, BookOpen, Loader2, CheckCircle2, Clock, ChevronRight, ChevronDown, Video, Circle, AlertTriangle, ChevronUp, PenTool } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css'; // Syntax highlighting theme
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useSyllabus, useSyllabusStatusPolling, useVideoStatusPolling, useSubchapter } from "@/hooks/useApi";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ChapterStructureGenerator } from "@/components/ChapterStructureGenerator";
import AITutorWidget from "@/components/AITutorWidget";
import { DrawingCanvas } from "@/components/DrawingCanvas";
import { Chapter, Subchapter, apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const SyllabusDetail = () => {
  const { syllabusId } = useParams();
  const navigate = useNavigate();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedSubchapterId, setSelectedSubchapterId] = useState<string | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [showFullContent, setShowFullContent] = useState(false);
  const [isTutorActive, setIsTutorActive] = useState(false);
  const [ragContent, setRagContent] = useState<string>('');

  // Blackboard state persistence
  const [blackboardData, setBlackboardData] = useState<string | null>(null);
  const [blackboardAnalysis, setBlackboardAnalysis] = useState<string>('');
  const [blackboardVideo, setBlackboardVideo] = useState<string>('');

  const { toast } = useToast();
  const { syllabus, loading: syllabusLoading, error: syllabusError } = useSyllabus(syllabusId!);

  // Poll syllabus status for processing state changes
  const shouldPollSyllabus = syllabus?.processing_status === 'processing' || syllabus?.processing_status === 'generating_chapters';
  const { status: syllabusStatus } = useSyllabusStatusPolling(syllabusId!, shouldPollSyllabus, 10000);

  // Use polling data if available, otherwise use base syllabus data
  const currentSyllabus = syllabusStatus || syllabus;

  // Fetch chapters when syllabus is loaded
  useEffect(() => {
    const fetchChapters = async () => {
      if (!currentSyllabus) return;

      try {
        const syllabusChapters = await apiClient.getSyllabusChapters(currentSyllabus.id);
        console.log('Fetched chapters:', syllabusChapters);
        setChapters(syllabusChapters);
      } catch (error) {
        console.error('Failed to fetch chapters:', error);
      }
    };

    fetchChapters();
  }, [currentSyllabus]);

  // Subchapter hook for the selected subchapter
  const {
    subchapter: selectedSubchapter,
    markComplete,
    generateVideo
  } = useSubchapter(selectedSubchapterId || '');

  // Set selectedChapterId from selectedSubchapter when subchapter is loaded
  useEffect(() => {
    if (selectedSubchapter?.chapter_id) {
      console.log('🔗 Setting selectedChapterId from subchapter:', selectedSubchapter.chapter_id);
      setSelectedChapterId(selectedSubchapter.chapter_id);
    }
  }, [selectedSubchapter?.chapter_id]);

  // Check if we should stop polling (when video is completed) - check base subchapter first
  const shouldStopPolling = selectedSubchapter?.video_status === 'completed' && selectedSubchapter?.video_progress === 100;
  const pollingEnabled = !!selectedChapterId && !shouldStopPolling;

  console.log('🎯 POLLING SETUP:', {
    selectedChapterId,
    selectedSubchapterId,
    shouldStopPolling,
    pollingEnabled
  });

  const { status: videoStatus } = useVideoStatusPolling(
    selectedChapterId || '',
    pollingEnabled,
    15000
  );

  // Fetch RAG content when subchapter changes
  useEffect(() => {
    const fetchRagContent = async () => {
      if (!selectedSubchapterId) {
        setRagContent('');
        return;
      }

      try {
        const ragResponse = await apiClient.getRagContent(selectedSubchapterId);
        setRagContent(ragResponse.rag_content || '');
      } catch (error) {
        console.error('Failed to fetch RAG content:', error);
        setRagContent('');
      }
    };

    fetchRagContent();
  }, [selectedSubchapterId]);

  // Create enhanced subchapter object that merges polling data with base subchapter data
  const enhancedSubchapter = useMemo(() => {
    console.log('🔄 EnhancedSubchapter calculation triggered');

    if (!selectedSubchapter) {
      console.log('❌ No selectedSubchapter available');
      return null;
    }

    console.log('📋 Base subchapter data:', {
      id: selectedSubchapter.id,
      title: selectedSubchapter.title,
      video_status: selectedSubchapter.video_status,
      video_progress: selectedSubchapter.video_progress,
      video_message: selectedSubchapter.video_message
    });

    // If we have polling data and it contains the current subchapter, use the updated status
    if (videoStatus?.subchapters) {
      console.log('🔍 Searching polling data for subchapter:', selectedSubchapter.id);
      const polledSubchapterData = videoStatus.subchapters.find(
        sub => sub.subchapter_id === selectedSubchapter.id
      );

      if (polledSubchapterData) {
        console.log('✅ Found polling data for subchapter:', {
          id: polledSubchapterData.subchapter_id,
          video_status: polledSubchapterData.video_status,
          video_progress: polledSubchapterData.video_progress,
          video_message: polledSubchapterData.video_message
        });

        const enhanced = {
          ...selectedSubchapter,
          video_status: polledSubchapterData.video_status,
          video_progress: polledSubchapterData.video_progress,
          video_message: polledSubchapterData.video_message,
          video_file_path: polledSubchapterData.video_file_path
        };

        console.log('🚀 Returning enhanced subchapter data:', {
          video_status: enhanced.video_status,
          video_progress: enhanced.video_progress,
          video_message: enhanced.video_message
        });

        return enhanced;
      } else {
        console.log('❌ No polling data found for subchapter:', selectedSubchapter.id);
      }
    } else {
      console.log('❌ No videoStatus polling data available');
    }

    // Return original subchapter data if no polling updates available
    console.log('📄 Returning original subchapter data');
    return selectedSubchapter;
  }, [selectedSubchapter, videoStatus]);

  // Update chapters state with polling data for sidebar icons
  useEffect(() => {
    if (videoStatus?.subchapters && chapters.length > 0) {
      console.log('🔄 Updating chapters state with polling data for sidebar');
      setChapters(prevChapters =>
        prevChapters.map(chapter => ({
          ...chapter,
          subchapters: chapter.subchapters?.map(subchapter => {
            const polledData = videoStatus.subchapters.find(
              polled => polled.subchapter_id === subchapter.id
            );
            if (polledData) {
              return {
                ...subchapter,
                video_status: polledData.video_status as Subchapter['video_status'],
                video_progress: polledData.video_progress,
                video_message: polledData.video_message,
                video_file_path: polledData.video_file_path
              };
            }
            return subchapter;
          })
        }))
      );
    }
  }, [videoStatus, chapters.length]);

  // Note: Automatic video generation removed - users now manually trigger via VideoPlayer button

  const handleChaptersGenerated = (newChapters: Chapter[]) => {
    setChapters(newChapters);
    // Auto-expand first chapter and select first subchapter
    if (newChapters.length > 0) {
      const firstChapter = newChapters[0];
      setExpandedChapters(new Set([firstChapter.id]));
      setSelectedChapterId(firstChapter.id);
      
      // Fetch chapter details to get subchapters
      fetchChapterDetails(firstChapter.id);
    }
  };

  const fetchChapterDetails = async (chapterId: string) => {
    try {
      const chapterDetails = await apiClient.getChapter(chapterId);
      
      // Update the chapters state with subchapter data
      setChapters(prev => prev.map(ch => 
        ch.id === chapterId 
          ? { ...ch, subchapters: chapterDetails.subchapters }
          : ch
      ));
      
      // Auto-select first subchapter if none selected
      if (!selectedSubchapterId && chapterDetails.subchapters && chapterDetails.subchapters.length > 0) {
        setSelectedSubchapterId(chapterDetails.subchapters[0].id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load chapter details",
        variant: "destructive",
      });
    }
  };

  const handleChapterClick = async (chapterId: string) => {
    const wasExpanded = expandedChapters.has(chapterId);
    const newExpanded = new Set(expandedChapters);
    
    if (wasExpanded) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
      
      // Fetch chapter details if not already loaded
      const chapter = chapters.find(ch => ch.id === chapterId);
      if (chapter && !chapter.subchapters) {
        await fetchChapterDetails(chapterId);
      }
    }
    
    setExpandedChapters(newExpanded);
  };


  const handleSubchapterComplete = async (checked: boolean) => {
    if (!selectedSubchapterId) return;
    
    try {
      await markComplete(checked);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleRegenerateVideo = async () => {
    if (!selectedSubchapterId) return;
    
    try {
      await generateVideo();
    } catch (error) {
      // Error handled by hook
    }
  };

  const calculateOverallProgress = () => {
    if (chapters.length === 0) return 0;
    
    const allSubchapters = chapters.flatMap(ch => ch.subchapters || []);
    if (allSubchapters.length === 0) return 0;
    
    const completedCount = allSubchapters.filter(sub => sub.is_completed).length;
    return Math.round((completedCount / allSubchapters.length) * 100);
  };

  const calculateChapterProgress = (chapter: Chapter) => {
    // Use the backend-calculated completion percentage
    return Math.round(chapter.completion_percentage);
  };

  const getCurrentChapter = () => {
    return chapters.find(ch => ch.subchapters?.some(sub => sub.id === selectedSubchapterId));
  };

  if (syllabusLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading syllabus...</p>
        </div>
      </div>
    );
  }

  if (syllabusError || !currentSyllabus) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <h2 className="text-lg font-medium mb-2">Syllabus Not Found</h2>
          <p className="text-muted-foreground mb-4">{syllabusError || 'The requested syllabus could not be loaded.'}</p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const currentChapter = getCurrentChapter();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 border-r border-border bg-card">
          {/* Header */}
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-3 mb-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/")}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <h1 className="text-lg font-semibold">{currentSyllabus.name}</h1>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {currentSyllabus.description}
                </p>
              </div>
            </div>
            
            {/* Syllabus Status */}
            <div className="flex items-center gap-2 mb-3">
              <Badge variant={currentSyllabus.processing_status === 'ready' ? 'default' : 'secondary'}>
                {currentSyllabus.processing_status === 'ready' ? 'Ready' :
                 currentSyllabus.processing_status === 'processing' ? 'Processing' :
                 currentSyllabus.processing_status === 'generating_chapters' ? 'Generating Chapters' :
                 currentSyllabus.processing_status}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {currentSyllabus.document_count} documents
              </span>
            </div>

            {/* Overall Progress */}
            {chapters.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{calculateOverallProgress()}%</span>
                </div>
                <Progress value={calculateOverallProgress()} className="h-2" />
              </div>
            )}
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 h-[calc(100vh-200px)]">
            <div className="p-4">
              {/* Syllabus processing state - show during processing or generating_chapters */}
              {(currentSyllabus.processing_status === 'processing' || currentSyllabus.processing_status === 'generating_chapters') && (
                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <h3 className="font-medium mb-2">Syllabus Processing</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {currentSyllabus.processing_status === 'generating_chapters' ? 'AI is generating chapter structure from your materials...' : 'Your syllabus materials are being processed. This may take a few minutes.'}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      Status: {currentSyllabus.processing_status === 'generating_chapters' ? 'Generating Chapters' : currentSyllabus.processing_status}
                    </Badge>
                  </CardContent>
                </Card>
              )}

              {/* No chapters generated yet - show generator if documents exist but no chapters and status is ready */}
              {chapters.length === 0 && currentSyllabus.document_count > 0 && currentSyllabus.processing_status === 'ready' && (
                <ChapterStructureGenerator
                  syllabusId={currentSyllabus.id}
                  onChaptersGenerated={handleChaptersGenerated}
                />
              )}

              {/* Chapters List - only show when status is ready */}
              {chapters.length > 0 && currentSyllabus.processing_status === 'ready' && (
                <div className="space-y-2">
                  {chapters.map((chapter) => (
                    <div key={chapter.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          className="flex-1 justify-between h-auto p-3 text-left"
                          onClick={() => handleChapterClick(chapter.id)}
                        >
                          <div className="flex items-center gap-3">
                            {expandedChapters.has(chapter.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm break-words hyphens-auto text-wrap" title={chapter.title}>
                                {chapter.title}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Progress 
                                  value={calculateChapterProgress(chapter)} 
                                  className="h-1 w-20" 
                                />
                                <span className="text-xs text-muted-foreground">
                                  {calculateChapterProgress(chapter)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </Button>
                      </div>

                      {/* Subchapters */}
                      {expandedChapters.has(chapter.id) && chapter.subchapters && (
                        <div className="ml-6 space-y-1">
                          {chapter.subchapters.map((subchapter) => (
                            <Button
                              key={subchapter.id}
                              variant={selectedSubchapterId === subchapter.id ? "secondary" : "ghost"}
                              size="sm"
                              className="w-full justify-start h-auto p-2 text-left"
                              onClick={() => setSelectedSubchapterId(subchapter.id)}
                            >
                              <div className="flex items-center gap-2 w-full">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {subchapter.is_completed ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                                  )}
                                  <span className="text-sm break-words hyphens-auto text-wrap" title={subchapter.title}>
                                    {subchapter.title}
                                  </span>
                                </div>
                                
                                {/* Video status indicator */}
                                <div className="shrink-0">
                                  {subchapter.video_status === 'completed' && subchapter.video_file_path && (
                                    <Video className="h-3 w-3 text-green-500" />
                                  )}
                                  {subchapter.video_status === 'queued' && (
                                    <Clock className="h-3 w-3 text-orange-500" />
                                  )}
                                  {(subchapter.video_status === 'generating_script' ||
                                    subchapter.video_status === 'generating_images' ||
                                    subchapter.video_status === 'generating_audio' ||
                                    subchapter.video_status === 'creating_scenes' ||
                                    subchapter.video_status === 'rendering_video') && (
                                    <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                                  )}
                                  {subchapter.video_status === 'failed' && (
                                    <AlertTriangle className="h-3 w-3 text-red-500" />
                                  )}
                                  {(!subchapter.video_status ||
                                    subchapter.video_status === 'not_started') && (
                                    <Circle className="h-3 w-3 text-muted-foreground" />
                                  )}
                                </div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      )}

                      {expandedChapters.has(chapter.id) && !chapter.subchapters && (
                        <div className="ml-6 p-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 inline mr-2 animate-spin" />
                          Loading lessons...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {enhancedSubchapter ? (
            <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
              {/* Subchapter Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">
                    Chapter {currentChapter?.order_index}
                  </Badge>
                  {enhancedSubchapter.is_completed && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold mb-2">{enhancedSubchapter.title}</h1>

                {/* Completion Toggle */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="completed"
                    checked={enhancedSubchapter.is_completed}
                    onCheckedChange={handleSubchapterComplete}
                  />
                  <label
                    htmlFor="completed"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Mark as completed
                  </label>
                </div>
              </div>

              {/* Content Tabs */}
              <Tabs defaultValue="learn" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="learn">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Learn
                  </TabsTrigger>
                  <TabsTrigger value="teacher">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Tutor Me!
                  </TabsTrigger>
                  <TabsTrigger value="blackboard">
                    <PenTool className="h-4 w-4 mr-2" />
                    Blackboard
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="learn" className="space-y-6">
                  {/* Video Player */}
                  <VideoPlayer
                    subchapterId={enhancedSubchapter.id}
                    videoStatus={enhancedSubchapter.video_status}
                    videoProgress={enhancedSubchapter.video_progress}
                    videoFilePath={enhancedSubchapter.video_file_path}
                    audioFilePath={enhancedSubchapter.audio_file_path}
                    videoMessage={enhancedSubchapter.video_message}
                    onRetry={handleRegenerateVideo}
                    onGenerateVideo={generateVideo}
                  />

                  {/* Text Content */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Course Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <div className="mb-4">
                          <div className={`transition-all duration-300 ${!showFullContent ? 'line-clamp-3' : ''}`}>
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeHighlight]}
                            >
                              {showFullContent
                                ? enhancedSubchapter.text_description
                                : enhancedSubchapter.text_description?.substring(0, 200) + (enhancedSubchapter.text_description?.length > 200 ? '...' : '')
                              }
                            </ReactMarkdown>
                          </div>

                          {enhancedSubchapter.text_description && enhancedSubchapter.text_description.length > 200 && (
                            <button
                              onClick={() => setShowFullContent(!showFullContent)}
                              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                            >
                              {showFullContent ? (
                                <>
                                  <span>Show less</span>
                                  <ChevronUp className="h-4 w-4" />
                                </>
                              ) : (
                                <>
                                  <span>Show more</span>
                                  <ChevronDown className="h-4 w-4" />
                                </>
                              )}
                            </button>
                          )}
                        </div>

                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="teacher" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>AI Teacher</CardTitle>
                      <CardDescription>
                        Chat with your AI teacher about this lesson using voice
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="border border-border rounded-lg bg-muted/30" style={{ height: '500px', position: 'relative' }}>
                        {!isTutorActive ? (
                          <div className="flex flex-col items-center justify-center h-full text-center px-6">
                            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-6 shadow-sm">
                              <MessageSquare className="h-8 w-8 text-accent-foreground" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3 text-foreground">
                              Chat with Aula
                            </h3>
                            <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">
                              Get personalized help and explanations about "{enhancedSubchapter.title}" from your AI tutor using voice
                            </p>
                            <Button
                              onClick={() => setIsTutorActive(true)}
                              className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-3 rounded-lg font-medium shadow-sm hover:shadow transition-all duration-200"
                            >
                              Start Conversation
                            </Button>
                            <div className="absolute bottom-4 right-4 text-xs text-muted-foreground">
                              Powered by ElevenLabs
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex flex-col">
                            <div className="flex justify-between items-center p-4 border-b border-border bg-card rounded-t-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center shadow-sm">
                                  <MessageSquare className="h-4 w-4 text-accent-foreground" />
                                </div>
                                <div>
                                  <h3 className="font-medium text-card-foreground">Aula - AI Tutor</h3>
                                  <p className="text-sm text-muted-foreground">Discussing: {enhancedSubchapter.title}</p>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsTutorActive(false)}
                                className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                              >
                                End Conversation
                              </Button>
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <AITutorWidget
                                topic={enhancedSubchapter.title}
                                ragContext={`## Main Content:
${enhancedSubchapter.text_description || ''}

${enhancedSubchapter.subtitles ? `## Video Content:
${enhancedSubchapter.subtitles}` : ''}

${ragContent ? `## Related Materials:
${ragContent}` : ''}`}
                                onClose={() => setIsTutorActive(false)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="blackboard" className="space-y-6">
                  <DrawingCanvas
                    subchapterId={enhancedSubchapter.id}
                    subchapterTitle={enhancedSubchapter.title}
                    persistedCanvasData={blackboardData}
                    persistedAnalysis={blackboardAnalysis}
                    persistedVideo={blackboardVideo}
                    onCanvasDataChange={setBlackboardData}
                    onAnalysisChange={setBlackboardAnalysis}
                    onVideoChange={setBlackboardVideo}
                  />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">
                  {chapters.length === 0 ? 'Generate Syllabus Structure' : 'Select a Lesson'}
                </h3>
                <p className="text-muted-foreground">
                  {chapters.length === 0 
                    ? 'Create your learning curriculum from uploaded materials'
                    : 'Choose a lesson from the sidebar to begin learning'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SyllabusDetail;