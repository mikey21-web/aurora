'use client';

import React, { FC, useCallback, useState } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useContentBrain, ContentBrain } from './use-content-brain.hook';
import { useToaster } from '@gitroom/react/toaster/toaster';

const STEPS = [
  {
    key: 'businessContext',
    label: 'What does your business do?',
    placeholder:
      'We build AI-powered tools for indie founders to schedule and generate social content without hiring a marketing team.',
    hint: 'Be specific. What problem do you solve, and for whom?',
    multiline: true,
  },
  {
    key: 'targetAudience',
    label: 'Who is your audience?',
    placeholder:
      'Solo founders and small startup teams (2–10 people) who are building in public and want consistent social presence.',
    hint: 'Think job title, stage, mindset — not just demographics.',
    multiline: true,
  },
  {
    key: 'tone',
    label: 'How should your content sound?',
    placeholder: 'Direct, founder-to-founder. No fluff. Honest about what works and what doesn\'t. Occasionally funny.',
    hint: 'Describe your voice as if briefing a ghostwriter.',
    multiline: true,
  },
  {
    key: 'competitors',
    label: 'Who are your main competitors?',
    placeholder: 'Buffer, Hootsuite, Later, Typefully',
    hint: 'Comma-separated. We use this to avoid sounding like them.',
    multiline: false,
  },
  {
    key: 'uniqueValue',
    label: 'What makes you different?',
    placeholder:
      'We\'re the only tool that actually learns what content your audience responds to and adjusts automatically. Most tools just schedule — we generate and improve.',
    hint: 'One or two sentences. This becomes your content differentiator.',
    multiline: true,
  },
  {
    key: 'extraContext',
    label: 'Anything else the AI should know? (optional)',
    placeholder:
      'We\'re pre-launch. Avoid talking about pricing. Our founder is active on X as @username. We focus on the US and EU markets.',
    hint: 'Constraints, topics to avoid, ongoing campaigns, your handles.',
    multiline: true,
  },
] as const;

type StepKey = (typeof STEPS)[number]['key'];

const emptyForm = (): Record<StepKey, string> => ({
  businessContext: '',
  targetAudience: '',
  tone: '',
  competitors: '',
  uniqueValue: '',
  extraContext: '',
});

const brainToForm = (brain: ContentBrain): Record<StepKey, string> => ({
  businessContext: brain.businessContext,
  targetAudience: brain.targetAudience,
  tone: brain.tone,
  competitors: Array.isArray(brain.competitors)
    ? brain.competitors.join(', ')
    : '',
  uniqueValue: brain.uniqueValue,
  extraContext: brain.extraContext ?? '',
});

export const ContentBrainInterview: FC<{ onDone?: () => void }> = ({
  onDone,
}) => {
  const { data: brain, mutate } = useContentBrain();
  const fetch = useFetch();
  const toaster = useToaster();

  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<StepKey, string>>(
    brain ? brainToForm(brain) : emptyForm()
  );

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;
  const isFirst = currentStep === 0;
  const progress = Math.round(((currentStep + 1) / STEPS.length) * 100);

  const handleChange = useCallback(
    (value: string) => {
      setForm((prev) => ({ ...prev, [step.key]: value }));
    },
    [step.key]
  );

  const handleNext = useCallback(() => {
    if (!isLast) {
      setCurrentStep((s) => s + 1);
    }
  }, [isLast]);

  const handleBack = useCallback(() => {
    if (!isFirst) setCurrentStep((s) => s - 1);
  }, [isFirst]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const competitors = form.competitors
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      const res = await fetch('/content-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, competitors }),
      });

      if (!res.ok) throw new Error('Failed to save');
      await mutate();
      toaster.show('Content Brain saved.', 'success');
      onDone?.();
    } catch {
      toaster.show('Something went wrong. Try again.', 'warning');
    } finally {
      setSaving(false);
    }
  }, [fetch, form, mutate, onDone, toaster]);

  const canAdvance =
    step.key === 'extraContext' || form[step.key].trim().length > 0;

  return (
    <div className="flex flex-col gap-8 w-full max-w-[640px] mx-auto py-10 px-4">
      {/* Progress bar */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-sm text-newTextColor/60">
          <span>Content Brain setup</span>
          <span>
            {currentStep + 1} / {STEPS.length}
          </span>
        </div>
        <div className="w-full h-1 bg-tableBorder rounded-full overflow-hidden">
          <div
            className="h-full bg-[#7c3aed] rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex flex-col gap-3">
        <label className="text-[22px] font-semibold text-newTextColor leading-tight">
          {step.label}
        </label>
        <p className="text-sm text-newTextColor/50">{step.hint}</p>

        {step.multiline ? (
          <textarea
            className="w-full min-h-[120px] bg-newBgColorInner border border-tableBorder rounded-lg px-4 py-3 text-newTextColor text-sm resize-none outline-none focus:border-[#7c3aed] transition-colors placeholder:text-newTextColor/30"
            placeholder={step.placeholder}
            value={form[step.key]}
            onChange={(e) => handleChange(e.target.value)}
            autoFocus
          />
        ) : (
          <input
            type="text"
            className="w-full bg-newBgColorInner border border-tableBorder rounded-lg px-4 py-3 text-newTextColor text-sm outline-none focus:border-[#7c3aed] transition-colors placeholder:text-newTextColor/30"
            placeholder={step.placeholder}
            value={form[step.key]}
            onChange={(e) => handleChange(e.target.value)}
            autoFocus
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={isFirst}
          className="px-5 py-2 rounded-lg border border-tableBorder text-sm text-newTextColor/70 hover:text-newTextColor disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Back
        </button>

        {isLast ? (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-[#7c3aed] text-white text-sm font-medium hover:bg-[#6d28d9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving…' : 'Save Content Brain'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canAdvance}
            className="px-6 py-2 rounded-lg bg-[#7c3aed] text-white text-sm font-medium hover:bg-[#6d28d9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};
