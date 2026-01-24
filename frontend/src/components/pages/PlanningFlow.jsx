import { useState, useCallback } from 'react';
import { useProject } from '../../context/ProjectContext';
import api from '../../lib/api';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  FileText, 
  BookOpen, 
  FileEdit,
  Users,
  Target,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

const STEPS = ['research_goal', 'output_type', 'audience', 'scope', 'review'];

const STEP_CONFIG = {
  research_goal: {
    title: 'What would you like to research?',
    description: 'Describe your research question or topic. Be as specific as possible for better results.',
    icon: Target
  },
  output_type: {
    title: 'What type of output do you need?',
    description: 'Choose the format that best fits your research goals.',
    icon: FileText,
    options: [
      { id: 'literature_review', label: 'Literature Review', description: 'A comprehensive synthesis of existing research on your topic', icon: BookOpen },
      { id: 'research_paper', label: 'Research Paper', description: 'A structured academic paper with introduction, methods, results, and discussion', icon: FileEdit },
      { id: 'brief', label: 'Research Brief', description: 'A concise summary of key findings for quick consumption', icon: FileText }
    ]
  },
  audience: {
    title: 'Who is the intended audience?',
    description: 'This helps tailor the language and depth appropriately.',
    icon: Users,
    options: [
      { id: 'academic', label: 'Academic Researchers', description: 'Detailed, technical language with full citations' },
      { id: 'professional', label: 'Industry Professionals', description: 'Applied focus with practical implications' },
      { id: 'policy', label: 'Policy Makers', description: 'Clear recommendations and policy implications' },
      { id: 'general', label: 'General Audience', description: 'Accessible language without jargon' }
    ]
  },
  scope: {
    title: 'How comprehensive should the review be?',
    description: 'This affects the number of sources and depth of analysis.',
    icon: Target,
    options: [
      { id: 'focused', label: 'Focused (10-20 papers)', description: 'Quick, targeted review of key sources' },
      { id: 'standard', label: 'Standard (20-40 papers)', description: 'Balanced coverage of the topic' },
      { id: 'comprehensive', label: 'Comprehensive (40+ papers)', description: 'Extensive review for thorough analysis' }
    ]
  }
};

export const PlanningFlow = ({ onComplete, onCancel }) => {
  const { setSelectedProject, triggerRefresh } = useProject();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState({
    research_goal: '',
    output_type: 'literature_review',
    audience: 'academic',
    scope: 'standard'
  });
  const [plan, setPlan] = useState(null);
  const [planNeedsRegeneration, setPlanNeedsRegeneration] = useState(true);
  const [loading, setLoading] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  // Track when answers change to know if plan needs regeneration
  const handleAnswerChange = useCallback((key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
    setPlanNeedsRegeneration(true);
  }, []);

  const currentStep = STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === STEPS.length - 1;
  const isReviewStep = currentStep === 'review';

  const handleNext = useCallback(async () => {
    if (currentStep === 'research_goal' && answers.research_goal.length < 10) {
      toast.error('Please provide a more detailed research goal (at least 10 characters)');
      return;
    }

    if (currentStepIndex < STEPS.length - 2) {
      setCurrentStepIndex(prev => prev + 1);
    } else if (currentStepIndex === STEPS.length - 2) {
      // Only generate plan if we don't already have one or answers changed
      if (plan && !planNeedsRegeneration) {
        setCurrentStepIndex(prev => prev + 1);
        return;
      }
      
      setGeneratingPlan(true);
      try {
        const response = await api.post('/planning/generate-plan', { answers }, { timeout: 60000 });
        setPlan(response.data);
        setPlanNeedsRegeneration(false);
        setCurrentStepIndex(prev => prev + 1);
      } catch (error) {
        console.error('Failed to generate plan:', error);
        const defaultPlan = {
          title: `Research: ${answers.research_goal.slice(0, 50)}...`,
          summary: `This ${answers.output_type?.replace('_', ' ')} will explore ${answers.research_goal} through systematic literature review.`,
          scope: `${answers.scope} review targeting ${answers.audience} audience`,
          phases: [
            { name: "Literature Discovery", description: "Search academic databases for relevant papers", tasks: [{ name: "Literature Search", type: "literature_search", description: "Search Semantic Scholar and arXiv" }] },
            { name: "Content Acquisition", description: "Download and parse paper contents", tasks: [{ name: "PDF Acquisition", type: "pdf_acquisition", description: "Download available PDFs" }] },
            { name: "Analysis & Synthesis", description: "Summarize and synthesize findings", tasks: [{ name: "Summarization", type: "summarization", description: "Generate paper summaries" }, { name: "Synthesis", type: "synthesis", description: "Synthesize literature" }] },
            { name: "Document Production", description: "Draft the final research document", tasks: [{ name: "Drafting", type: "drafting", description: "Draft final document" }] }
          ],
          estimated_papers: answers.scope === 'focused' ? 15 : answers.scope === 'comprehensive' ? 50 : 30,
          search_terms: [],
          key_themes: []
        };
        setPlan(defaultPlan);
        setPlanNeedsRegeneration(false);
        setCurrentStepIndex(prev => prev + 1);
        toast.info('Using default plan structure');
      } finally {
        setGeneratingPlan(false);
      }
    }
  }, [currentStepIndex, currentStep, answers, plan, planNeedsRegeneration]);

  const handleBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  const handleApprove = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.post('/planning/approve', { 
        answers, 
        plan: plan || {} 
      });
      
      // Fetch the created project
      const projectRes = await api.get(`/projects/${response.data.project_id}`);
      setSelectedProject(projectRes.data);
      triggerRefresh();
      toast.success('Project created successfully!');
      onComplete(projectRes.data);
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project');
    } finally {
      setLoading(false);
    }
  }, [answers, plan, setSelectedProject, triggerRefresh, onComplete]);

  const renderStepContent = () => {
    if (isReviewStep) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight font-['IBM_Plex_Sans']">
                Review Your Research Plan
              </h2>
              <p className="text-sm text-muted-foreground">
                Confirm the details before we begin execution.
              </p>
            </div>
          </div>

          {plan && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{plan.title}</CardTitle>
                <CardDescription>{plan.summary}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Scope</h4>
                  <p className="text-sm text-muted-foreground">{plan.scope}</p>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Execution Phases</h4>
                  <div className="space-y-3">
                    {plan.phases?.map((phase, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{phase.name}</p>
                          <p className="text-xs text-muted-foreground">{phase.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {plan.search_terms?.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium mb-2">Search Terms</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {plan.search_terms.map((term, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {term}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                
                <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
                  <span>~{plan.estimated_papers} papers</span>
                  <span>•</span>
                  <span className="capitalize">{answers.output_type?.replace('_', ' ')}</span>
                  <span>•</span>
                  <span className="capitalize">{answers.audience}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    const config = STEP_CONFIG[currentStep];
    const Icon = config.icon;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight font-['IBM_Plex_Sans']">
              {config.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {config.description}
            </p>
          </div>
        </div>

        {currentStep === 'research_goal' ? (
          <Textarea
            placeholder="e.g., Regional disparities in adolescent mental health across urban and rural communities..."
            value={answers.research_goal}
            onChange={(e) => handleAnswerChange('research_goal', e.target.value)}
            className="min-h-[150px] text-base"
            data-testid="research-goal-textarea"
          />
        ) : config.options ? (
          <RadioGroup
            value={answers[currentStep]}
            onValueChange={(value) => handleAnswerChange(currentStep, value)}
            className="space-y-3"
          >
            {config.options.map((option) => (
              <Label
                key={option.id}
                htmlFor={option.id}
                className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                  answers[currentStep] === option.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{option.description}</div>
                </div>
              </Label>
            ))}
          </RadioGroup>
        ) : null}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col" data-testid="planning-flow">
      {/* Progress Bar */}
      <div className="px-6 py-4 border-b border-border">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((step, idx) => (
              <div 
                key={step}
                className={`flex items-center ${idx < STEPS.length - 1 ? 'flex-1' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  idx < currentStepIndex 
                    ? 'bg-primary text-primary-foreground' 
                    : idx === currentStepIndex
                    ? 'bg-primary/20 text-primary border-2 border-primary'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {idx < currentStepIndex ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    idx + 1
                  )}
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-colors ${
                    idx < currentStepIndex ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-2xl mx-auto px-6 py-8">
          {generatingPlan ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Generating your research plan...</p>
            </div>
          ) : (
            renderStepContent()
          )}
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-border">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={currentStepIndex === 0 ? onCancel : handleBack}
            disabled={loading || generatingPlan}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {currentStepIndex === 0 ? 'Cancel' : 'Back'}
          </Button>

          {isReviewStep ? (
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleBack}
                disabled={loading}
              >
                Revise
              </Button>
              <Button 
                onClick={handleApprove}
                disabled={loading}
                data-testid="approve-plan-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Create Project
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button 
              onClick={handleNext}
              disabled={generatingPlan || (currentStep === 'research_goal' && answers.research_goal.length < 10)}
              data-testid="next-step-btn"
            >
              {generatingPlan ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
