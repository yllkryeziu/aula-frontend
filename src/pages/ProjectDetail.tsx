import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, PlayCircle, FileText, MessageSquare, BookOpen, Loader2, CheckCircle2, Clock, Wand2, ChevronRight, ChevronDown, Video, Circle, AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useCourse, useVideoStatusPolling, useSubchapter } from "@/hooks/useApi";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ChapterStructureGenerator } from "@/components/ChapterStructureGenerator";
import { Chapter, Subchapter, apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedSubchapterId, setSelectedSubchapterId] = useState<string | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [videoGenerationStarted, setVideoGenerationStarted] = useState(false);

  const { toast } = useToast();
  const { course, loading: courseLoading, error: courseError } = useCourse(projectId!);

  // Fetch chapters when course is loaded
  useEffect(() => {
    const fetchChapters = async () => {
      if (!course || course.processing_status !== 'completed') return;

      try {
        // For now, we'll simulate chapters - in a real implementation, you'd have an endpoint
        // to get all chapters for a course. Based on the API docs, this might be part of
        // the course detail or a separate endpoint
        setChapters([]);
      } catch (error) {
        console.error('Failed to fetch chapters:', error);
      }
    };

    fetchChapters();
  }, [course]);

  // Video status polling
  const { status: videoStatus } = useVideoStatusPolling(
    selectedChapterId || '',
    videoGenerationStarted && !!selectedChapterId,
    15000
  );

  // Subchapter hook for the selected subchapter
  const { 
    subchapter: selectedSubchapter, 
    loading: subchapterLoading, 
    markComplete,
    generateVideo 
  } = useSubchapter(selectedSubchapterId || '');

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

  const handleOpenChapter = async (chapterId: string) => {
    try {
      const result = await apiClient.openChapter(chapterId, true); // auto-generate videos
      setVideoGenerationStarted(true);
      setSelectedChapterId(chapterId);
      
      toast({
        title: "Chapter Opened",
        description: result.video_generation_started 
          ? `Video generation started for ${result.subchapters_found} lessons. Estimated time: ${result.estimated_completion}`
          : "Chapter opened successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open chapter",
        variant: "destructive",
      });
    }
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
    
    const completedCount = allSubchapters.filter(sub => sub.completion_status).length;
    return Math.round((completedCount / allSubchapters.length) * 100);
  };

  const calculateChapterProgress = (chapter: Chapter) => {
    if (!chapter.subchapters || chapter.subchapters.length === 0) return 0;
    
    const completedCount = chapter.subchapters.filter(sub => sub.completion_status).length;
    return Math.round((completedCount / chapter.subchapters.length) * 100);
  };

  const getCurrentChapter = () => {
    return chapters.find(ch => ch.subchapters?.some(sub => sub.id === selectedSubchapterId));
  };

  if (courseLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading course...</p>
        </div>
      </div>
    );
  }

  if (courseError || !course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <h2 className="text-lg font-medium mb-2">Course Not Found</h2>
          <p className="text-muted-foreground mb-4">{courseError || 'The requested course could not be loaded.'}</p>
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
                <h1 className="text-lg font-semibold">{course.name}</h1>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {course.description}
                </p>
              </div>
            </div>
            
            {/* Course Status */}
            <div className="flex items-center gap-2 mb-3">
              <Badge variant={course.processing_status === 'completed' ? 'default' : 'secondary'}>
                {course.processing_status === 'completed' ? 'Ready' : 
                 course.processing_status === 'processing' ? 'Processing' :
                 course.processing_status}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {course.document_count} documents
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
              {/* Course not ready state */}
              {course.processing_status !== 'completed' && (
                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <h3 className="font-medium mb-2">Course Processing</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Your course materials are being processed. This may take a few minutes.
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      Status: {course.processing_status}
                    </Badge>
                  </CardContent>
                </Card>
              )}

              {/* No chapters generated yet */}
              {course.processing_status === 'completed' && chapters.length === 0 && (
                <ChapterStructureGenerator 
                  courseId={course.id}
                  onChaptersGenerated={handleChaptersGenerated}
                />
              )}

              {/* Chapters List */}
              {chapters.length > 0 && (
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
                            <div className="flex-1">
                              <div className="font-medium text-sm">{chapter.title}</div>
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

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenChapter(chapter.id)}
                          className="shrink-0"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Start
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
                                <div className="flex items-center gap-2 flex-1">
                                  {subchapter.completion_status ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <span className="text-sm">{subchapter.title}</span>
                                </div>
                                
                                {/* Video status indicator */}
                                <div className="shrink-0">
                                  {subchapter.video_status === 'COMPLETED' && (
                                    <Video className="h-3 w-3 text-green-500" />
                                  )}
                                  {(subchapter.video_status === 'GENERATING_SCRIPT' || 
                                    subchapter.video_status === 'RENDERING_VIDEO') && (
                                    <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                                  )}
                                  {subchapter.video_status === 'FAILED' && (
                                    <AlertTriangle className="h-3 w-3 text-red-500" />
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
          {selectedSubchapter ? (
            <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
              {/* Subchapter Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">
                    Chapter {currentChapter?.order_index}
                  </Badge>
                  {selectedSubchapter.completion_status && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold mb-2">{selectedSubchapter.title}</h1>
                <p className="text-muted-foreground mb-4">{selectedSubchapter.text_description}</p>

                {/* Completion Toggle */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="completed"
                    checked={selectedSubchapter.completion_status}
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
                    Ask Teacher
                  </TabsTrigger>
                  <TabsTrigger value="resources">
                    <FileText className="h-4 w-4 mr-2" />
                    Resources
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="learn" className="space-y-6">
                  {/* Video Player */}
                  <VideoPlayer
                    subchapterId={selectedSubchapter.id}
                    videoStatus={selectedSubchapter.video_status}
                    videoProgress={selectedSubchapter.video_progress}
                    videoFilePath={selectedSubchapter.video_file_path}
                    audioFilePath={selectedSubchapter.audio_file_path}
                    onRetry={handleRegenerateVideo}
                  />

                  {/* Text Content */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Course Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <p>{selectedSubchapter.text_description}</p>
                        
                        {selectedSubchapter.rag_content && (
                          <div className="mt-6 p-4 bg-muted rounded-lg">
                            <h4 className="font-medium mb-2">Related Course Materials:</h4>
                            <div className="text-sm whitespace-pre-wrap">
                              {selectedSubchapter.rag_content.substring(0, 500)}
                              {selectedSubchapter.rag_content.length > 500 && '...'}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="teacher" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>AI Teacher</CardTitle>
                      <CardDescription>
                        Chat with your AI teacher about this lesson (Coming Soon)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground mb-4">
                          AI teacher integration will be available soon with ElevenLabs voice chat
                        </p>
                        <Button disabled variant="outline">
                          Start Conversation
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="resources" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Course Materials</CardTitle>
                      <CardDescription>
                        Related content from your uploaded documents
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {selectedSubchapter.rag_content ? (
                        <div className="space-y-4">
                          <div className="p-4 bg-muted rounded-lg">
                            <pre className="text-sm whitespace-pre-wrap font-sans">
                              {selectedSubchapter.rag_content}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            No additional resources available for this lesson
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">
                  {chapters.length === 0 ? 'Generate Course Structure' : 'Select a Lesson'}
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

export default ProjectDetail;