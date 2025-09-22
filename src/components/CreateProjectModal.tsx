import { useState } from "react";
import { X, Upload, Book } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (name: string) => void;
}

export const CreateProjectModal = ({ isOpen, onClose, onCreateProject }: CreateProjectModalProps) => {
  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const handleNext = () => {
    if (step === 1 && projectName.trim()) {
      setStep(2);
    }
  };

  const handleCreate = () => {
    onCreateProject(projectName);
    // Reset modal state
    setStep(1);
    setProjectName("");
    setFiles([]);
    onClose();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const handleReset = () => {
    setStep(1);
    setProjectName("");
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
                {step === 1 ? "Create a study project" : "Add reference materials"}
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
                  What course are you studying?
                </Label>
                <Input
                  id="course-name"
                  value={projectName}
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
                  disabled={!projectName.trim()}
                  className="bg-primary hover:bg-primary/90"
                >
                  Create project
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
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Book className="h-4 w-4" />
                        {file.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleCreate}
                  className="bg-primary hover:bg-primary/90"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};