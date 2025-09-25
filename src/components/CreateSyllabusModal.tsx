import { useState } from "react";
import { X, Upload, Book, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useDocuments } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";

interface CreateSyllabusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSyllabus: (syllabusId: string, name: string) => void;
}

export const CreateSyllabusModal = ({ isOpen, onClose, onCreateSyllabus }: CreateSyllabusModalProps) => {
  const [step, setStep] = useState(1);
  const [syllabusName, setSyllabusName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [syllabusId, setSyllabusId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [creatingSyllabus, setCreatingSyllabus] = useState(false);
  
  const { toast } = useToast();
  const { uploadDocument } = useDocuments(syllabusId || '');

  const handleNext = async () => {
    if (step === 1 && syllabusName.trim()) {
      try {
        setCreatingSyllabus(true);
        // Create syllabus first
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/syllabi/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: syllabusName,
            description: `A syllabus for studying ${syllabusName} materials, where Claude helps create personalized learning resources, visualize key concepts, and build comprehensive study strategies tailored to your learning needs.`,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create syllabus');
        }

        const syllabus = await response.json();
        setSyllabusId(syllabus.id);
        setStep(2);
        
        toast({
          title: "Syllabus Created",
          description: "Now add reference materials to generate your personalized curriculum.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create syllabus. Please try again.",
          variant: "destructive",
        });
      } finally {
        setCreatingSyllabus(false);
      }
    }
  };

  const handleCreate = async () => {
    if (!syllabusId) return;

    if (files.length > 0) {
      try {
        setUploading(true);
        setUploadProgress(0);
        
        // Upload files one by one
        for (let i = 0; i < files.length; i++) {
          await uploadDocument(files[i]);
          setUploadProgress(((i + 1) / files.length) * 100);
        }

        toast({
          title: "Upload Complete",
          description: "All materials uploaded. You can now generate your syllabus structure!",
        });
      } catch (error) {
        toast({
          title: "Upload Error",
          description: "Some files failed to upload. You can try again later.",
          variant: "destructive",
        });
      } finally {
        setUploading(false);
      }
    }

    // Navigate to the syllabus
    onCreateSyllabus(syllabusId, syllabusName);
    
    // Reset modal state
    setStep(1);
    setSyllabusName("");
    setFiles([]);
    setSyllabusId(null);
    setUploadProgress(0);
    onClose();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const handleReset = () => {
    setStep(1);
    setSyllabusName("");
    setFiles([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleReset}>
      <DialogContent className="sm:max-w-lg border-0 shadow-xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">
                {step === 1 ? "Create a syllabus" : "Add reference materials"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Step {step} of 2
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Step 1: Project Name */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="course-name" className="text-base font-medium">
                  What subject are you studying?
                </Label>
                <Input
                  id="course-name"
                  value={syllabusName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder=""
                  className="mt-3 h-12 text-base"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="ghost" onClick={handleReset}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleNext}
                  disabled={!syllabusName.trim() || creatingSyllabus}
                  className="bg-primary hover:bg-primary/90"
                >
                  {creatingSyllabus ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create syllabus'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: File Upload */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-medium mb-4">Reference materials</h3>
                
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Book className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                    Drag and drop course materials like syllabi, lecture notes, or textbook excerpts so Claude can help you learn.
                  </p>
                  
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.txt,.md"
                  />
                  <Label 
                    htmlFor="file-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md cursor-pointer text-sm font-medium transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    Choose files
                  </Label>
                </div>

                {/* Selected Files */}
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium">Selected files ({files.length})</h4>
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Book className="h-4 w-4" />
                        <span className="flex-1">{file.name}</span>
                        <span className="text-xs">{(file.size / 1024 / 1024).toFixed(2)}MB</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Progress */}
                {uploading && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Uploading files...</span>
                      <span className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setStep(1)}
                  disabled={uploading}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleCreate}
                  disabled={uploading}
                  className="bg-primary hover:bg-primary/90"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};