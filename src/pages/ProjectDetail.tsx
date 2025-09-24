import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, FileText, HelpCircle, CheckCircle, Circle, ChevronRight, ChevronDown, BookOpen, Video, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [selectedChapterId, setSelectedChapterId] = useState<string>("ch1");
  const [selectedSubchapterId, setSelectedSubchapterId] = useState<string>("sub1");
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set(["ch1"]));

  // Mock syllabus data based on the schema
  const syllabus = {
    id: projectId,
    name: "Psychology 101",
    description: "Introduction to Psychology - Understanding Human Behavior and Mental Processes",
    status: "ready",
    created_at: "2024-01-15",
  };

  const chapters = [
    {
      id: "ch1",
      title: "Introduction to Psychology",
      order_index: 1,
      is_generated: true,
      completion_percentage: 75,
      subchapters: [
        {
          id: "sub1",
          title: "What is Psychology?",
          order_index: 1,
          text_description: "An overview of psychology as a scientific discipline...",
          is_completed: true,
          content_generated: true,
        },
        {
          id: "sub2",
          title: "History of Psychology",
          order_index: 2,
          text_description: "Evolution of psychological thought from ancient times...",
          is_completed: true,
          content_generated: true,
        },
        {
          id: "sub3",
          title: "Research Methods",
          order_index: 3,
          text_description: "Scientific methods used in psychological research...",
          is_completed: false,
          content_generated: true,
        },
      ]
    },
    {
      id: "ch2",
      title: "Biological Psychology",
      order_index: 2,
      is_generated: true,
      completion_percentage: 33,
      subchapters: [
        {
          id: "sub4",
          title: "The Nervous System",
          order_index: 1,
          text_description: "Structure and function of the nervous system...",
          is_completed: true,
          content_generated: true,
        },
        {
          id: "sub5",
          title: "Brain Structure",
          order_index: 2,
          text_description: "Major brain regions and their functions...",
          is_completed: false,
          content_generated: true,
        },
        {
          id: "sub6",
          title: "Neurotransmitters",
          order_index: 3,
          text_description: "Chemical messengers in the brain...",
          is_completed: false,
          content_generated: false,
        },
      ]
    },
    {
      id: "ch3",
      title: "Learning and Memory",
      order_index: 3,
      is_generated: false,
      completion_percentage: 0,
      subchapters: []
    }
  ];

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const getCurrentSubchapter = () => {
    for (const chapter of chapters) {
      const subchapter = chapter.subchapters.find(sub => sub.id === selectedSubchapterId);
      if (subchapter) return subchapter;
    }
    return null;
  };

  const currentSubchapter = getCurrentSubchapter();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Chapter Sidebar */}
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
              <div>
                <h1 className="text-lg font-semibold">{syllabus.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {syllabus.description}
                </p>
              </div>
            </div>
            
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>54%</span>
              </div>
              <Progress value={54} className="h-2" />
            </div>
          </div>

          {/* Chapters List */}
          <ScrollArea className="flex-1 h-[calc(100vh-200px)]">
            <div className="p-4 space-y-2">
              {chapters.map((chapter) => (
                <div key={chapter.id} className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-between h-auto p-3 text-left"
                    onClick={() => toggleChapter(chapter.id)}
                  >
                    <div className="flex items-center gap-3">
                      {expandedChapters.has(chapter.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <div>
                        <div className="font-medium text-sm">{chapter.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={chapter.completion_percentage} className="h-1 w-20" />
                          <span className="text-xs text-muted-foreground">
                            {Math.round(chapter.completion_percentage)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </Button>

                  {/* Subchapters */}
                  {expandedChapters.has(chapter.id) && (
                    <div className="ml-6 space-y-1">
                      {chapter.subchapters.map((subchapter) => (
                        <Button
                          key={subchapter.id}
                          variant={selectedSubchapterId === subchapter.id ? "secondary" : "ghost"}
                          size="sm"
                          className="w-full justify-start h-auto p-2 text-left"
                          onClick={() => setSelectedSubchapterId(subchapter.id)}
                        >
                          <div className="flex items-center gap-2">
                            {subchapter.is_completed ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="text-sm">{subchapter.title}</span>
                          </div>
                        </Button>
                      ))}
                      
                      {chapter.subchapters.length === 0 && (
                        <div className="text-sm text-muted-foreground p-2">
                          No subchapters generated yet
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {currentSubchapter ? (
            <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
              {/* Subchapter Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">
                    Chapter {chapters.find(c => c.subchapters.some(s => s.id === selectedSubchapterId))?.order_index}
                  </Badge>
                  {currentSubchapter.is_completed && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold mb-2">{currentSubchapter.title}</h1>
                <p className="text-muted-foreground">{currentSubchapter.text_description}</p>
              </div>

              {/* Content Tabs */}
              <Tabs defaultValue="learn" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="learn">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Learn
                  </TabsTrigger>
                  <TabsTrigger value="practice">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Practice
                  </TabsTrigger>
                  <TabsTrigger value="resources">
                    <FileText className="h-4 w-4 mr-2" />
                    Resources
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="learn" className="space-y-6">
                  {/* Video/Audio Content */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Video className="h-5 w-5" />
                        Video Lesson
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {currentSubchapter.content_generated ? (
                        <div className="space-y-4">
                          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                            <Button size="lg" className="gap-2">
                              <Play className="h-5 w-5" />
                              Play Video
                            </Button>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="gap-2">
                              <Headphones className="h-4 w-4" />
                              Audio Only
                            </Button>
                            <Button variant="outline" size="sm">
                              Transcript
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground mb-4">Video content not generated yet</p>
                          <Button>Generate Video</Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Text Content */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Key Concepts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <p>{currentSubchapter.text_description}</p>
                        <p>This subchapter covers the fundamental concepts and provides a comprehensive understanding of the topic through interactive content and practical examples.</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="practice" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Practice Questions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground mb-4">Practice questions will appear here</p>
                        <Button>Generate Questions</Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="resources" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Additional Resources</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground mb-4">Additional resources and materials</p>
                        <Button variant="outline">Browse Resources</Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Select a Subchapter</h3>
                <p className="text-muted-foreground">Choose a subchapter from the sidebar to begin learning</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;