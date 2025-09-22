import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateProjectModal } from "@/components/CreateProjectModal";
import { useNavigate } from "react-router-dom";

interface Project {
  id: string;
  name: string;
  description: string;
  materialCount: number;
  createdAt: Date;
}

const Dashboard = () => {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      name: "Psychology 101",
      description: "A project for studying your course materials, where Claude helps create personalized learning resources, visualize key concepts, and build comprehensive study strategies tailored to your learning needs.",
      materialCount: 3,
      createdAt: new Date("2024-01-15")
    }
  ]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleCreateProject = (name: string) => {
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      description: "A project for studying your course materials, where Claude helps create personalized learning resources, visualize key concepts, and build comprehensive study strategies tailored to your learning needs.",
      materialCount: 0,
      createdAt: new Date()
    };
    setProjects(prev => [newProject, ...prev]);
    navigate(`/project/${newProject.id}`);
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Study Projects</h1>
          <p className="text-muted-foreground">
            Create personalized learning experiences with Claude's help
          </p>
        </div>

        <div className="grid gap-6">
          {/* Create New Project Card */}
          <Card 
            className="border-2 border-dashed border-border hover:border-accent/50 cursor-pointer transition-colors"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <CardContent className="flex items-center justify-center p-8">
              <div className="text-center">
                <Plus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <h3 className="font-medium mb-1">Create a new study project</h3>
                <p className="text-sm text-muted-foreground">
                  Get started with Claude-powered learning
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Existing Projects */}
          {projects.map((project) => (
            <Card 
              key={project.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleProjectClick(project.id)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription className="mt-2">
                      {project.description}
                    </CardDescription>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>{project.materialCount} materials</div>
                    <div>{project.createdAt.toLocaleDateString()}</div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      <CreateProjectModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
};

export default Dashboard;
