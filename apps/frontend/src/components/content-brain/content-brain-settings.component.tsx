'use client';

import React, { FC, useCallback, useEffect, useState } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useContentBrain } from './use-content-brain.hook';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { ContentBrainInterview } from './content-brain-interview.component';

const Field: FC<{
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
}> = ({ label, hint, value, onChange, multiline, placeholder }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium text-newTextColor">{label}</label>
    <p className="text-xs text-newTextColor/50">{hint}</p>
    {multiline ? (
      <textarea
        className="w-full min-h-[88px] bg-newBgColorInner border border-tableBorder rounded-lg px-3 py-2 text-sm text-newTextColor resize-none outline-none focus:border-[#7c3aed] transition-colors placeholder:text-newTextColor/30"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    ) : (
      <input
        type="text"
        className="w-full bg-newBgColorInner border border-tableBorder rounded-lg px-3 py-2 text-sm text-newTextColor outline-none focus:border-[#7c3aed] transition-colors placeholder:text-newTextColor/30"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    )}
  </div>
);

export const ContentBrainSettings: FC = () => {
  const { data: brain, isLoading, mutate } = useContentBrain();
  const fetch = useFetch();
  const toaster = useToaster();
  const [saving, setSaving] = useState(false);
  const [showInterview, setShowInterview] = useState(false);

  const [form, setForm] = useState({
    businessContext: '',
    targetAudience: '',
    tone: '',
    competitors: '',
    uniqueValue: '',
    extraContext: '',
  });

  useEffect(() => {
    if (brain) {
      setForm({
        businessContext: brain.businessContext ?? '',
        targetAudience: brain.targetAudience ?? '',
        tone: brain.tone ?? '',
        competitors: Array.isArray(brain.competitors)
          ? brain.competitors.join(', ')
          : '',
        uniqueValue: brain.uniqueValue ?? '',
        extraContext: brain.extraContext ?? '',
      });
    }
  }, [brain]);

  const set = useCallback(
    (key: keyof typeof form) => (value: string) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    []
  );

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

      if (!res.ok) throw new Error('Save failed');
      await mutate();
      toaster.show('Content Brain updated.', 'success');
    } catch {
      toaster.show('Save failed. Try again.', 'warning');
    } finally {
      setSaving(false);
    }
  }, [fetch, form, mutate, toaster]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32 text-newTextColor/40 text-sm">
        Loading…
      </div>
    );
  }

  if (!brain && !showInterview) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-newTextColor/60 text-sm max-w-[360px]">
          Your Content Brain is empty. It takes 2 minutes to set up and makes
          every generated post dramatically better.
        </p>
        <button
          className="px-6 py-2.5 rounded-lg bg-[#7c3aed] text-white text-sm font-medium hover:bg-[#6d28d9] transition-colors"
          onClick={() => setShowInterview(true)}
        >
          Set up Content Brain
        </button>
      </div>
    );
  }

  if (showInterview) {
    return (
      <ContentBrainInterview
        onDone={() => {
          setShowInterview(false);
          mutate();
        }}
      />
    );
  }

  const learnings = brain?.learnings;

  return (
    <div className="flex flex-col gap-6 max-w-[640px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-newTextColor">
            Content Brain
          </h2>
          <p className="text-xs text-newTextColor/50 mt-0.5">
            This context shapes every post Aurra generates for you.
          </p>
        </div>
        {learnings?.totalFeedback ? (
          <div className="flex gap-3 text-xs text-newTextColor/50">
            <span>✓ {learnings.approvalRate}% approved</span>
            <span>✎ {learnings.editRate}% edited</span>
            <span>✕ {learnings.discardRate}% skipped</span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-5">
        <Field
          label="What does your business do?"
          hint="Be specific. What problem do you solve, and for whom?"
          value={form.businessContext}
          onChange={set('businessContext')}
          multiline
        />
        <Field
          label="Who is your audience?"
          hint="Job title, stage, mindset — not just demographics."
          value={form.targetAudience}
          onChange={set('targetAudience')}
          multiline
        />
        <Field
          label="How should your content sound?"
          hint="Describe your voice as if briefing a ghostwriter."
          value={form.tone}
          onChange={set('tone')}
          multiline
        />
        <Field
          label="Competitors (comma-separated)"
          hint="We use this to make sure your content sounds nothing like theirs."
          value={form.competitors}
          onChange={set('competitors')}
          placeholder="Buffer, Hootsuite, Later"
        />
        <Field
          label="What makes you different?"
          hint="One or two sentences. This becomes your content differentiator."
          value={form.uniqueValue}
          onChange={set('uniqueValue')}
          multiline
        />
        <Field
          label="Extra context (optional)"
          hint="Topics to avoid, ongoing campaigns, your social handles, target markets."
          value={form.extraContext}
          onChange={set('extraContext')}
          multiline
        />
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="self-start px-6 py-2.5 rounded-lg bg-[#7c3aed] text-white text-sm font-medium hover:bg-[#6d28d9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  );
};
