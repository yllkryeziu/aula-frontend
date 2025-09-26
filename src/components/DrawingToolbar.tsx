import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  MousePointer2,
  Pencil,
  Square,
  Circle,
  Eraser,
  Trash2
} from "lucide-react";

export type DrawingTool = "select" | "draw" | "rectangle" | "circle" | "erase";

interface DrawingToolbarProps {
  activeTool: DrawingTool;
  onToolClick: (tool: DrawingTool) => void;
  activeColor: string;
  onColorChange: (color: string) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  onClear: () => void;
  onDelete: () => void;
}

const colors = [
  "#ffffff", // White
  "#2563eb", // Blue
  "#dc2626", // Red
  "#16a34a", // Green
  "#ca8a04", // Yellow
  "#9333ea", // Purple
  "#ea580c", // Orange
  "#0891b2", // Cyan
  "#000000", // Black
];

export const DrawingToolbar = ({
  activeTool,
  onToolClick,
  activeColor,
  onColorChange,
  brushSize,
  onBrushSizeChange,
  onClear,
  onDelete,
}: DrawingToolbarProps) => {
  const toolButtons = [
    { tool: "select" as DrawingTool, icon: MousePointer2, label: "Select" },
    { tool: "draw" as DrawingTool, icon: Pencil, label: "Draw" },
    { tool: "rectangle" as DrawingTool, icon: Square, label: "Rectangle" },
    { tool: "circle" as DrawingTool, icon: Circle, label: "Circle" },
    { tool: "erase" as DrawingTool, icon: Eraser, label: "Erase" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Drawing Tools */}
      <div className="flex gap-1">
        {toolButtons.map(({ tool, icon: Icon, label }) => (
          <Button
            key={tool}
            variant={activeTool === tool ? "default" : "outline"}
            size="sm"
            onClick={() => onToolClick(tool)}
            className={activeTool === tool ? "bg-primary text-primary-foreground" : ""}
            title={label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* Colors */}
      <div className="flex gap-1">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => onColorChange(color)}
            className={`w-8 h-8 rounded-md border-2 transition-all ${
              activeColor === color
                ? "border-primary scale-110"
                : "border-gray-300 hover:scale-105"
            }`}
            style={{ backgroundColor: color }}
            title={`Color: ${color}`}
          />
        ))}
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* Brush Size */}
      <div className="flex items-center gap-2 min-w-[120px]">
        <Label className="text-xs">Size:</Label>
        <Slider
          value={[brushSize]}
          onValueChange={(value) => onBrushSizeChange(value[0])}
          max={20}
          min={1}
          step={1}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground w-6 text-center">
          {brushSize}
        </span>
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* Action Buttons */}
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
          title="Delete Selected (Del/Backspace)"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
          title="Clear Canvas"
        >
          Clear All
        </Button>
      </div>
    </div>
  );
};