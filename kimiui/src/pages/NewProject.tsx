import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, ArrowRight, Check } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button, Card, CardHeader } from '@/components/common';
import { projectApi, planningApi } from '@/api/client';

const outputTypes = [
  { value: 'literature_review', label: 'Literature Review', description: 'Comprehensive analysis of existing research' },
  { value: 'research_paper', label: 'Research Paper', description: 'Original research with methodology and findings' },
  { value: 'summary', label: 'Summary Report', description: 'Concise overview of key findings' },
];

const audiences = [
  { value: 'academic', label: 'Academic', description: 'Researchers and scholars' },
  { value: 'industry', label: 'Industry', description: 'Professionals and practitioners' },
  { value: 'policy', label: 'Policy', description: 'Decision makers and policymakers' },
  { value: 'general', label: 'General', description: 'Broader public audience' },
];

export function NewProject() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  
  const [formData, setFormData] = useState({
    research_goal: '',
    output_type: 'literature_review',
    audience: 'academic',
  });

  const handleCreate = async () => {
    if (!formData.research_goal.trim()) return;
    
    setIsCreating(true);
    const result = await projectApi.create({
      research_goal: formData.research_goal,
      output_type: formData.output_type,
      audience: formData.audience,
    });
    
    if (result.data) {
      navigate(`/projects/${result.data.id}`);
    }
    setIsCreating(false);
  };

  return (
    <div className="min-h-screen">
      <Header 
        title="New Research Project" 
        subtitle="Create a new AI-powered research project"
      />

      <div className="p-6 max-w-4xl mx-auto">
        {/* Progress */}
        <div className="flex items-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-4">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  s < step
                    ? 'bg-green-500 text-white'
                    : s === step
                    ? 'bg-kimipurple-500 text-white'
                    : 'bg-kimidark-700 text-gray-400'
                }`}
              >
                {s < step ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-16 h-0.5 ${
                    s < step ? 'bg-green-500' : 'bg-kimidark-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Research Goal */}
        {step === 1 && (
          <Card>
            <CardHeader 
              title="What would you like to research?" 
              subtitle="Describe your research topic or question"
            />
            <div className="space-y-4">
              <textarea
                value={formData.research_goal}
                onChange={(e) => setFormData({ ...formData, research_goal: e.target.value })}
                placeholder="e.g., Analyze recent developments in quantum computing hardware and their implications for cryptography..."
                className="w-full h-40 px-4 py-3 bg-kimidark-700 border border-kimidark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-kimipurple-500/50 resize-none"
              />
              <div className="flex justify-end">
                <Button
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  onClick={() => setStep(2)}
                  disabled={!formData.research_goal.trim()}
                >
                  Continue
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Step 2: Output Type */}
        {step === 2 && (
          <Card>
            <CardHeader 
              title="What type of output do you need?" 
              subtitle="Select the format for your research output"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {outputTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFormData({ ...formData, output_type: type.value })}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    formData.output_type === type.value
                      ? 'bg-kimipurple-500/10 border-kimipurple-500/50'
                      : 'bg-kimidark-700 border-kimidark-600 hover:border-kimidark-500'
                  }`}
                >
                  <h4 className={`font-medium mb-1 ${
                    formData.output_type === type.value ? 'text-kimipurple-400' : 'text-white'
                  }`}>
                    {type.label}
                  </h4>
                  <p className="text-sm text-gray-400">{type.description}</p>
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button rightIcon={<ArrowRight className="w-4 h-4" />} onClick={() => setStep(3)}>
                Continue
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Audience */}
        {step === 3 && (
          <Card>
            <CardHeader 
              title="Who is your target audience?" 
              subtitle="This helps tailor the language and depth of the research"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {audiences.map((audience) => (
                <button
                  key={audience.value}
                  onClick={() => setFormData({ ...formData, audience: audience.value })}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    formData.audience === audience.value
                      ? 'bg-kimipurple-500/10 border-kimipurple-500/50'
                      : 'bg-kimidark-700 border-kimidark-600 hover:border-kimidark-500'
                  }`}
                >
                  <h4 className={`font-medium mb-1 ${
                    formData.audience === audience.value ? 'text-kimipurple-400' : 'text-white'
                  }`}>
                    {audience.label}
                  </h4>
                  <p className="text-sm text-gray-400">{audience.description}</p>
                </button>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-kimidark-700 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-medium text-white mb-3">Project Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-gray-500">Goal:</span>
                  <span className="text-gray-300">{formData.research_goal}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500">Output:</span>
                  <span className="text-gray-300 capitalize">{formData.output_type.replace('_', ' ')}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500">Audience:</span>
                  <span className="text-gray-300 capitalize">{formData.audience}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
              <Button 
                leftIcon={<Sparkles className="w-4 h-4" />}
                onClick={handleCreate}
                isLoading={isCreating}
              >
                Create Project
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
