import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Send, Eye, BookOpen, GraduationCap, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  // Mock project data
  const project = {
    name: "Psychology 101",
    description: "A project for studying your course materials, where Claude helps create personalized learning resources, visualize key concepts, and build comprehensive study strategies tailored to your learning needs.",
    isPrivate: true
  };

  const referenceMaterials = [
    { name: "Psych101-lecture1", lines: "1,234 lines", type: "DOC" },
    { name: "Psych101-lecture2", lines: "821 lines", type: "DOC" },
    { name: "Psych101-syllabus", lines: "565 lines", type: "TXT" }
  ];

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    setChatMessages(prev => [
      ...prev,
      { role: 'user', content: message },
      { role: 'assistant', content: "I'd be happy to help you with your Psychology 101 studies. What specific topic would you like to explore?" }
    ]);
    setMessage("");
  };

  const actionButtons = [
    { icon: Eye, label: "Visualize key concepts", description: "Create visual diagrams and concept maps" },
    { icon: BookOpen, label: "Create a study guide", description: "Generate comprehensive study materials" },
    { icon: GraduationCap, label: "Tutor me", description: "Get personalized tutoring and explanations" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/")}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold">{project.name}</h1>
                  {project.isPrivate && (
                    <Badge variant="secondary" className="text-xs">
                      🔒 Private
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {project.description}
                </p>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full p-6">
            {chatMessages.length === 0 ? (
              // Empty State
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-center mb-8">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="What can I help you with today?"
                    className="w-full max-w-lg mx-auto h-12 text-base"
                  />
                  
                  <div className="flex items-center justify-between mt-4 max-w-lg mx-auto">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Claude 3.7 Sonnet</span>
                      <ChevronDown className="h-4 w-4" />
                    </div>
                    
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!message.trim()}
                      className="h-8 w-8 p-0 bg-accent hover:bg-accent/90"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {actionButtons.map((action) => (
                    <Card key={action.label} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4 text-center">
                        <action.icon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                        <h3 className="font-medium text-sm mb-1">{action.label}</h3>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Start a chat to keep conversations organized and re-use reference materials.
                </p>
              </div>
            ) : (
              // Chat Messages
              <div className="flex-1 space-y-4 mb-4">
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-card border'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Input Area for Active Chat */}
            {chatMessages.length > 0 && (
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="bg-accent hover:bg-accent/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Reference Materials Sidebar */}
        <div className="w-80 border-l border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium">Reference materials</h2>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3 mb-6">
            <div className="text-sm text-accent">
              "You are assisting a student with their academi..."
              <span className="text-accent ml-2">Edit</span>
            </div>
            <div className="w-full bg-accent h-1 rounded-full">
              <div className="bg-accent h-1 rounded-full" style={{ width: '7%' }}></div>
            </div>
            <div className="text-xs text-muted-foreground">7% of capacity used</div>
          </div>

          <div className="space-y-3">
            {referenceMaterials.map((material, index) => (
              <div key={index} className="text-center">
                <div className="text-sm font-medium text-foreground mb-1">
                  {material.name}
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {material.lines}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {material.type}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;