'use client';

import React, { FC, useCallback, useState } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';

interface QualityResult {
  score: number;
  strengths: string[];
  improvements: string[];
  verdict: string;
}

interface QualityScoreProps {
  content: string;
  platform?: string;
}

const scoreColor = (score: number) => {
  if (score >= 8) return 'text-green-400';
  if (score >= 5) return 'text-yellow-400';
  return 'text-red-400';
};

const scoreBg = (score: number) => {
  if (score >= 8) return 'bg-green-400/10 border-green-400/30';
  if (score >= 5) return 'bg-yellow-400/10 border-yellow-400/30';
  return 'bg-red-400/10 border-red-400/30';
};

export const QualityScore: FC<QualityScoreProps> = ({ content, platform }) => {
  const fetch = useFetch();
  const toaster = useToaster();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QualityResult | null>(null);
  const [open, setOpen] = useState(false);

  const analyze = useCallback(async () => {
    if (!content || content.length < 10) {
      toaster.show('Write some content first', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/content-brain/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, platform }),
      });
      const data = await res.json();
      setResult(data);
      setOpen(true);
    } catch {
      toaster.show('Failed to analyze content', 'warning');
    } finally {
      setLoading(false);
    }
  }, [content, platform, fetch, toaster]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-newTextColor">AI Quality Score</span>
        <button
          onClick={analyze}
          disabled={loading}
          className="text-xs px-3 py-1.5 bg-newBgColorInner border border-tableBorder text-newTextColor rounded-md hover:border-[#7c3aed] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Analyzing…' : result ? `${result.score}/10 — Re-analyze` : 'Analyze'}
        </button>
      </div>

      {result && open && (
        <div className={`rounded-lg border p-3 flex flex-col gap-2 ${scoreBg(result.score)}`}>
          <div className="flex items-center justify-between">
            <span className={`text-2xl font-bold ${scoreColor(result.score)}`}>
              {result.score}<span className="text-sm font-normal text-newTextColor/50">/10</span>
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-xs text-newTextColor/40 hover:text-newTextColor"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-newTextColor/70 italic">{result.verdict}</p>

          {result.strengths.length > 0 && (
            <div>
              <p className="text-xs font-medium text-green-400 mb-1">What works</p>
              <ul className="flex flex-col gap-0.5">
                {result.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-newTextColor/70 flex gap-1.5">
                    <span className="text-green-400 shrink-0">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.improvements.length > 0 && (
            <div>
              <p className="text-xs font-medium text-yellow-400 mb-1">Improve</p>
              <ul className="flex flex-col gap-0.5">
                {result.improvements.map((s, i) => (
                  <li key={i} className="text-xs text-newTextColor/70 flex gap-1.5">
                    <span className="text-yellow-400 shrink-0">→</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
