import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, Circle, Rect, PencilBrush } from "fabric";
import { DrawingToolbar, DrawingTool } from "./DrawingToolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";
import { apiClient } from "@/lib/api";
import { VideoPlayer } from "@/components/VideoPlayer";
import { useBlackboardVideo } from "@/hooks/useApi";

interface DrawingCanvasProps {
  subchapterId: string;
  subchapterTitle: string;
  persistedCanvasData?: string | null;
  persistedAnalysis?: string;
  persistedVideo?: string;
  onCanvasDataChange?: (data: string) => void;
  onAnalysisChange?: (analysis: string) => void;
  onVideoChange?: (video: string) => void;
}

export const DrawingCanvas = ({
  subchapterId,
  subchapterTitle,
  persistedCanvasData,
  persistedAnalysis,
  persistedVideo,
  onCanvasDataChange,
  onAnalysisChange,
  onVideoChange
}: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeColor, setActiveColor] = useState("#000000");
  const [activeTool, setActiveTool] = useState<DrawingTool>("draw");
  const [brushSize, setBrushSize] = useState(3);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>(persistedAnalysis || "");

  const { toast } = useToast();

  // Blackboard video polling hook
  const { blackboardStatus } = useBlackboardVideo(subchapterId, true, 15000);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 700,
      height: 500,
      backgroundColor: "#ffffff",
    });

    // Restore canvas from persisted data if available
    if (persistedCanvasData) {
      try {
        canvas.loadFromJSON(persistedCanvasData, () => {
          canvas.renderAll();
          toast({
            title: "Canvas Restored",
            description: "Your previous drawing has been restored!",
          });
        });
      } catch (error) {
        console.error("Failed to restore canvas data:", error);
        toast({
          title: "Canvas Ready",
          description: "Start drawing to explain your understanding!",
        });
      }
    } else {
      toast({
        title: "Canvas Ready",
        description: "Start drawing to explain your understanding!",
      });
    }

    // Add event listener to save canvas data on changes
    const saveCanvasData = () => {
      if (onCanvasDataChange) {
        const canvasData = JSON.stringify(canvas.toJSON());
        onCanvasDataChange(canvasData);
      }
    };

    canvas.on('path:created', saveCanvasData);
    canvas.on('object:added', saveCanvasData);
    canvas.on('object:removed', saveCanvasData);
    canvas.on('object:modified', saveCanvasData);

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [persistedCanvasData, onCanvasDataChange, toast]);

  useEffect(() => {
    if (!fabricCanvas) return;

    // Set drawing mode based on active tool
    fabricCanvas.isDrawingMode = activeTool === "draw";

    // Create and set brush for drawing
    if (activeTool === "draw") {
      const brush = new PencilBrush(fabricCanvas);
      brush.color = activeColor;
      brush.width = brushSize;
      fabricCanvas.freeDrawingBrush = brush;
    }

    // Update existing brush properties
    if (fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = activeColor;
      fabricCanvas.freeDrawingBrush.width = brushSize;
    }
  }, [activeTool, activeColor, brushSize, fabricCanvas]);

  const handleToolClick = (tool: DrawingTool) => {
    setActiveTool(tool);

    if (!fabricCanvas) return;

    if (tool === "rectangle") {
      const rect = new Rect({
        left: 100,
        top: 100,
        fill: "transparent",
        stroke: activeColor,
        strokeWidth: 2,
        width: 100,
        height: 100,
      });
      fabricCanvas.add(rect);
      fabricCanvas.setActiveObject(rect);
    } else if (tool === "circle") {
      const circle = new Circle({
        left: 100,
        top: 100,
        fill: "transparent",
        stroke: activeColor,
        strokeWidth: 2,
        radius: 50,
      });
      fabricCanvas.add(circle);
      fabricCanvas.setActiveObject(circle);
    }
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();

    // Clear all persisted state
    setAnalysisResult("");
    onCanvasDataChange?.("");
    onAnalysisChange?.("");
    onVideoChange?.("");

    toast({
      title: "Canvas Cleared",
      description: "Canvas has been cleared successfully!",
    });
  };

  const handleDelete = useCallback(() => {
    if (!fabricCanvas) return;
    const activeObjects = fabricCanvas.getActiveObjects();
    if (activeObjects.length > 0) {
      fabricCanvas.remove(...activeObjects);
      fabricCanvas.discardActiveObject();
      toast({
        title: "Objects Deleted",
        description: `Deleted ${activeObjects.length} object(s)`,
      });
    }
  }, [fabricCanvas, toast]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDelete]);

  const getCanvasAsDataURL = (): string => {
    if (!fabricCanvas) return "";

    // Just get the canvas as is - no background switching
    return fabricCanvas.toDataURL({
      format: 'png',
      quality: 0.8,
      multiplier: 1,
    });
  };

  const analyzeWithClaude = async (imageData: string): Promise<string> => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    console.log('Calling analyze API:', `${baseUrl}/api/v1/analyze`);

    try {
      const response = await fetch(`${baseUrl}/api/v1/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_data: imageData
        })
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        throw new Error(`Analysis failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Analysis result:', result);

      if (!result.analysis) {
        throw new Error('No analysis returned from API');
      }

      return result.analysis;
    } catch (error) {
      console.error('Analyze API error:', error);
      throw error;
    }
  };

  const generateVideo = async (prompt: string): Promise<string> => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    console.log('Calling video generation API:', `${baseUrl}/api/v1/video/videos`);
    console.log('Video generation prompt:', prompt);

    try {
      const response = await fetch(`${baseUrl}/api/v1/video/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          subchapter_id: subchapterId,
          duration_limit: 400
        }),
      });

      console.log('Video API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Video API Error:', errorText);
        throw new Error(`Video generation failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Video generation result:', result);

      const videoUrl = result.video_url || result.video_path;
      if (!videoUrl) {
        throw new Error('No video URL returned from API');
      }

      return videoUrl;
    } catch (error) {
      console.error('Video generation error:', error);
      throw error;
    }
  };

  const analyzeDrawing = async () => {
    if (!fabricCanvas) {
      toast({
        title: "Error",
        description: "Canvas not ready",
        variant: "destructive",
      });
      return;
    }

    // Check if canvas has any content
    const objects = fabricCanvas.getObjects();
    if (objects.length === 0) {
      toast({
        title: "No Drawing",
        description: "Please draw something on the canvas first!",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    // Only clear analysis result, not video URL
    setAnalysisResult("");

    try {
      const imageData = getCanvasAsDataURL();

      // Debug logging
      console.log("Canvas objects:", objects.length);
      console.log("Image data length:", imageData.length);
      console.log("Image data preview:", imageData.substring(0, 100));

      toast({
        title: "Analyzing",
        description: "Analyzing drawing with Claude AI...",
      });

      // Step 1: Get analysis
      const analysis = await analyzeWithClaude(imageData);
      setAnalysisResult(analysis);
      onAnalysisChange?.(analysis);

      // Step 2: Start blackboard video generation
      toast({
        title: "Starting Video Generation",
        description: "Creating your educational video...",
      });

      await generateVideo(analysis);

      toast({
        title: "Video Generation Started",
        description: "Your blackboard video is being generated. This usually takes 2-3 minutes.",
      });

    } catch (error) {
      console.error("Error analyzing drawing:", error);

      // Only clear analysis on error, keep video if it exists
      onAnalysisChange?.("");

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      toast({
        title: "Analysis Failed",
        description: `${errorMessage}. Check console for details.`,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Drawing Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <DrawingToolbar
              activeTool={activeTool}
              onToolClick={handleToolClick}
              activeColor={activeColor}
              onColorChange={setActiveColor}
              brushSize={brushSize}
              onBrushSizeChange={setBrushSize}
              onClear={handleClear}
              onDelete={handleDelete}
            />

            <Button
              onClick={analyzeDrawing}
              disabled={isAnalyzing}
              className="min-w-[200px] px-10 py-4 bg-accent hover:bg-accent/90 text-accent-foreground shadow-sm hover:shadow transition-all duration-200 whitespace-nowrap text-xs"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Analyze & Generate Video
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Canvas */}
      <Card>
        <CardContent className="p-0">
          <div className="flex justify-center bg-white border rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              className="block cursor-crosshair"
              style={{ touchAction: 'none' }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Blackboard Video Player */}
      <VideoPlayer
        subchapterId={subchapterId}
        videoStatus={blackboardStatus?.status || 'not_started'}
        videoProgress={blackboardStatus?.progress || 0}
        videoFilePath={blackboardStatus?.filePath}
        audioFilePath={null}
        videoMessage={blackboardStatus?.message}
        videoType="blackboard"
        onGenerateVideo={() => {
          // This will be handled by the analyze function
          console.log('Generate video triggered from VideoPlayer');
        }}
      />

      {/* Instructions */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          Use the drawing tools to visualize and explain your understanding of "{subchapterTitle}".
          Click "Analyze & Generate Video" to get AI feedback and a video explanation.
          Press Delete or Backspace to remove selected objects.
        </p>
      </div>
    </div>
  );
};