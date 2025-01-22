import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Lock, Globe } from 'lucide-react';

const GRID_SIZES = [
  { value: "20", label: "20 x 20" },
  { value: "30", label: "30 x 30" },
  { value: "40", label: "40 x 40" },
  { value: "50", label: "50 x 50" },
];

const getDifficultyColor = (threshold) => {
  if (threshold <= 25) return "bg-green-500";
  if (threshold <= 50) return "bg-yellow-500";
  if (threshold <= 75) return "bg-orange-500";
  return "bg-red-500";
};

const getDifficultyText = (threshold) => {
  if (threshold <= 25) return "Normal";
  if (threshold <= 50) return "Hard";
  if (threshold <= 75) return "Very Hard";
  return "Extreme";
};

const CreateGameDialog = ({
  open,
  onOpenChange,
  selectedTeam,
  setSelectedTeam,
  gridSize,
  setGridSize,
  isPrivate,
  setIsPrivate,
  territoryThreshold,
  setTerritoryThreshold,
  onCreateGame,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background">
        <DialogHeader>
          <DialogTitle>Create New Game</DialogTitle>
          <DialogDescription>
            Set up your 2-player game preferences
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label>Select Your Team</Label>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className={cn(
                  "h-24 border-2",
                  selectedTeam === "red"
                    ? "border-red-500 bg-red-500/10 hover:bg-red-500/20"
                    : "hover:border-red-500/50 hover:bg-red-500/10"
                )}
                onClick={() => setSelectedTeam("red")}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-red-500" />
                  <span>Red Team</span>
                </div>
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "h-24 border-2",
                  selectedTeam === "blue"
                    ? "border-blue-500 bg-blue-500/10 hover:bg-blue-500/20"
                    : "hover:border-blue-500/50 hover:bg-blue-500/10"
                )}
                onClick={() => setSelectedTeam("blue")}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-blue-500" />
                  <span>Blue Team</span>
                </div>
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Game Settings</Label>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Grid Size</Label>
                  <Select value={gridSize} onValueChange={setGridSize}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grid size" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRID_SIZES.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm">Territory Threshold</Label>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        getDifficultyColor(territoryThreshold)
                      )} />
                      <span className="text-sm text-muted-foreground">
                        {territoryThreshold}% - {getDifficultyText(territoryThreshold)}
                      </span>
                    </div>
                  </div>
                  <Slider
                    value={[territoryThreshold]}
                    onValueChange={([value]) => setTerritoryThreshold(value)}
                    min={5}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  {territoryThreshold > 25 && (
                    <Alert variant="warning" className="mt-2">
                      <AlertDescription className="text-xs">
                        {territoryThreshold > 75 
                          ? "Winning is almost impossible!"
                          : territoryThreshold > 50 
                            ? "Very challenging situation!"
                            : "This will be a tough game!"}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm">{isPrivate ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}</Label>
                    <Label className="text-sm">Private Room</Label>
                  </div>
                  <Switch
                    checked={isPrivate}
                    onCheckedChange={setIsPrivate}
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm text-muted-foreground">Players</span>
                  <span className="text-sm">2 players</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Button
            onClick={onCreateGame}
            disabled={!selectedTeam || !gridSize}
            className="w-full"
          >
            Create Game
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGameDialog;