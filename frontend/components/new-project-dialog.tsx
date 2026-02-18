'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { projectApi } from '@/lib/api';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface NewProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated?: () => void;
}

const outputTypes = [
    { value: 'literature_review', label: 'Literature Review' },
    { value: 'research_paper', label: 'Research Paper' },
    { value: 'analysis_report', label: 'Analysis Report' },
    { value: 'thesis_chapter', label: 'Thesis Chapter' },
    { value: 'meta_analysis', label: 'Meta-Analysis' },
];

export function NewProjectDialog({ open, onOpenChange, onCreated }: NewProjectDialogProps) {
    const router = useRouter();
    const [researchGoal, setResearchGoal] = useState('');
    const [outputType, setOutputType] = useState('literature_review');
    const [audience, setAudience] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (researchGoal.length < 10) {
            setError('Research goal must be at least 10 characters.');
            return;
        }

        setSubmitting(true);
        setError('');

        const res = await projectApi.create({
            research_goal: researchGoal,
            output_type: outputType,
            audience: audience || undefined,
        });

        if (res.data) {
            setResearchGoal('');
            setAudience('');
            onCreated?.();
            router.push(`/projects/${res.data.id}`);
        } else {
            setError(res.error || 'Failed to create project.');
        }

        setSubmitting(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="font-ui text-lg">New Project</DialogTitle>
                    <DialogDescription className="text-sm text-base-500">
                        Describe your research goal and we&apos;ll set up a workspace for you.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-2">
                    {/* Research Goal */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-base-500 font-ui">
                            Research Goal
                        </label>
                        <textarea
                            value={researchGoal}
                            onChange={(e) => setResearchGoal(e.target.value)}
                            placeholder="e.g. Investigate the relationship between sleep quality and cognitive performance in adults over 65..."
                            rows={3}
                            className="flex w-full rounded-md border border-input bg-base-0 px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none resize-none"
                        />
                    </div>

                    {/* Output Type */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-base-500 font-ui">
                            Output Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {outputTypes.map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setOutputType(type.value)}
                                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${outputType === type.value
                                            ? 'bg-accent-50 border-accent-300 text-accent-700'
                                            : 'bg-base-0 border-base-200 text-base-600 hover:border-base-300'
                                        }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Audience (optional) */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-base-500 font-ui">
                            Target Audience <span className="text-base-400">(optional)</span>
                        </label>
                        <Input
                            value={audience}
                            onChange={(e) => setAudience(e.target.value)}
                            placeholder="e.g. Academic peers, Policy makers"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-xs text-error font-medium">{error}</p>
                    )}

                    {/* Submit */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-base-600 hover:text-base-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || researchGoal.length < 10}
                            className="bg-accent-500 hover:bg-accent-600 text-base-0 px-5 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors duration-200 font-ui disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
