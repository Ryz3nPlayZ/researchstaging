import { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { projectsApi } from '../../lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const CreateProjectDialog = ({ open, onOpenChange }) => {
  const { setSelectedProject, triggerRefresh } = useProject();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    research_goal: '',
    output_type: 'literature_review',
    audience: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.research_goal.trim()) {
      toast.error('Please enter a research goal');
      return;
    }

    if (formData.research_goal.trim().length < 10) {
      toast.error('Research goal must be at least 10 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await projectsApi.create(formData);
      setSelectedProject(response.data);
      triggerRefresh();
      toast.success('Project created successfully');
      onOpenChange(false);
      setFormData({
        research_goal: '',
        output_type: 'literature_review',
        audience: '',
      });
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error(error.response?.data?.detail || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="create-project-dialog">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-['IBM_Plex_Sans'] tracking-tight">
              Create Research Project
            </DialogTitle>
            <DialogDescription>
              Enter your research goal. The system will automatically plan and execute the research pipeline.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="research_goal">Research Goal</Label>
              <Textarea
                id="research_goal"
                placeholder="e.g., Regional disparities in adolescent mental health across urban and rural communities"
                value={formData.research_goal}
                onChange={(e) => setFormData({ ...formData, research_goal: e.target.value })}
                className="min-h-[100px]"
                data-testid="research-goal-input"
              />
              <p className="text-xs text-muted-foreground">
                Describe your research topic or question in detail.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="output_type">Output Type</Label>
              <Select
                value={formData.output_type}
                onValueChange={(value) => setFormData({ ...formData, output_type: value })}
              >
                <SelectTrigger data-testid="output-type-select">
                  <SelectValue placeholder="Select output type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="literature_review">Literature Review</SelectItem>
                  <SelectItem value="research_paper">Research Paper</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="audience">Target Audience (Optional)</Label>
              <Input
                id="audience"
                placeholder="e.g., Academic researchers, policy makers"
                value={formData.audience}
                onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                data-testid="audience-input"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} data-testid="create-project-submit">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
