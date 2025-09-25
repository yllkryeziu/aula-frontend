import { useState } from 'react';
import { Wand2, Loader2, CheckCircle2, AlertCircle, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient, Chapter } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ChapterStructureGeneratorProps {
  syllabusId: string;
  onChaptersGenerated: (chapters: Chapter[]) => void;
}

export const ChapterStructureGenerator = ({ syllabusId, onChaptersGenerated }: ChapterStructureGeneratorProps) => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerateStructure = async () => {
    try {
      setGenerating(true);
      setError(null);

      const chapters = await apiClient.generateChapters(syllabusId, {
        max_items: 8,
        depth_level: 2
      });

      onChaptersGenerated(chapters);
      
      toast({
        title: "Syllabus Structure Generated!",
        description: `Created ${chapters.length} chapters from your uploaded materials.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate syllabus structure';
      setError(message);
      toast({
        title: "Generation Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <BookOpen className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Generate Syllabus Structure</CardTitle>
        <CardDescription>
          AI will analyze your uploaded materials and create a comprehensive learning curriculum with chapters and lessons.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="text-center space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            This process will:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              Analyze your uploaded documents
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              Create structured learning chapters
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              Generate detailed lesson plans
            </li>
          </ul>
        </div>

        <Button 
          onClick={handleGenerateStructure}
          disabled={generating}
          size="lg"
          className="w-full"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Structure...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Generate Syllabus Structure
            </>
          )}
        </Button>

        {generating && (
          <p className="text-xs text-muted-foreground">
            This may take 30-60 seconds depending on your material complexity
          </p>
        )}
      </CardContent>
    </Card>
  );
};