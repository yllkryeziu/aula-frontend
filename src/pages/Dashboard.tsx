import { useState } from "react";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateSyllabusModal } from "@/components/CreateSyllabusModal";
import { useNavigate } from "react-router-dom";
import { useSyllabi } from "@/hooks/useApi";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();
  const { syllabi, loading, error, refetch } = useSyllabi();

  const handleCreateSyllabus = (syllabusId: string, name: string) => {
    navigate(`/syllabus/${syllabusId}`);
  };

  const handleSyllabusClick = (syllabusId: string) => {
    navigate(`/syllabus/${syllabusId}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Ready</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'created':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Created</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Study Syllabi</h1>
          <p className="text-muted-foreground">
            Create personalized learning experiences with Claude's help
          </p>
        </div>

        <div className="grid gap-6">
          {/* Create New Syllabus Card */}
          <Card 
            className="border-2 border-dashed border-border hover:border-accent/50 cursor-pointer transition-colors"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <CardContent className="flex items-center justify-center p-8">
              <div className="text-center">
                <Plus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <h3 className="font-medium mb-1">Create a new syllabus</h3>
                <p className="text-sm text-muted-foreground">
                  Get started with Claude-powered learning
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {loading && (
            <Card>
              <CardContent className="flex items-center justify-center p-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading syllabi...
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="flex items-center justify-center p-8">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <p className="text-destructive font-medium">Failed to load syllabi</p>
                  <p className="text-sm text-muted-foreground mb-4">{error}</p>
                  <Button onClick={refetch} size="sm">
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Syllabi */}
          {!loading && !error && syllabi.map((syllabus) => (
            <Card 
              key={syllabus.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleSyllabusClick(syllabus.id)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">{syllabus.name}</CardTitle>
                      {getStatusBadge(syllabus.processing_status)}
                    </div>
                    <CardDescription className="mt-2">
                      {syllabus.description}
                    </CardDescription>
                  </div>
                  <div className="text-right text-sm text-muted-foreground ml-4">
                    <div>{syllabus.document_count} materials</div>
                    <div>{syllabus.chapter_count} chapters</div>
                    <div>{new Date(syllabus.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}

          {/* Empty State */}
          {!loading && !error && syllabi.length === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center p-12">
                <div className="text-center">
                  <h3 className="font-medium mb-2">No syllabi yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first syllabus to get started with AI-powered learning
                  </p>
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Syllabus
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <CreateSyllabusModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateSyllabus={handleCreateSyllabus}
      />
    </div>
  );
};

export default Dashboard;
