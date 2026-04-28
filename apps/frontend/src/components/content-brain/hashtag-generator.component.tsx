'use client';

import React, { FC, useCallback, useState } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';

interface HashtagGeneratorProps {
  content: string;
  platform?: string;
  onInsert?: (hashtags: string) => void;
}

export const HashtagGenerator: FC<HashtagGeneratorProps> = ({
  content,
  platform,
  onInsert,
}) => {
  const fetch = useFetch();
  const toaster = useToaster();
  const [loading, setLoading] = useState(false);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const generate = useCallback(async () => {
    if (!content || content.length < 10) {
      toaster.show('Write some content first', 'warning');
      return;
    }
    setLoading(true);
    setHashtags([]);
    setSelected(new Set());
    try {
      const res = await fetch('/content-brain/hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, platform }),
      });
      const data = await res.json();
      setHashtags(data.hashtags || []);
    } catch {
      toaster.show('Failed to generate hashtags', 'warning');
    } finally {
      setLoading(false);
    }
  }, [content, platform, fetch, toaster]);

  const toggle = useCallback((tag: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }, []);

  const insertSelected = useCallback(() => {
    if (selected.size === 0) return;
    onInsert?.([...selected].join(' '));
    toaster.show(`${selected.size} hashtags inserted`, 'success');
  }, [selected, onInsert, toaster]);

  return (
    <div className="flex flex-col gap-3 p-3 bg-newBgColorInner border border-tableBorder rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-newTextColor"># AI Hashtags</span>
        <button
          onClick={generate}
          disabled={loading}
          className="text-xs px-3 py-1.5 bg-[#7c3aed] text-white rounded-md hover:bg-[#6d28d9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Generating…' : 'Generate'}
        </button>
      </div>

      {hashtags.length > 0 && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {hashtags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggle(tag)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  selected.has(tag)
                    ? 'bg-[#7c3aed] text-white border-[#7c3aed]'
                    : 'bg-transparent text-newTextColor border-tableBorder hover:border-[#7c3aed]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {onInsert && (
            <button
              onClick={insertSelected}
              disabled={selected.size === 0}
              className="text-xs px-3 py-1.5 border border-[#7c3aed] text-[#7c3aed] rounded-md hover:bg-[#7c3aed]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors self-end"
            >
              Insert {selected.size > 0 ? `(${selected.size})` : ''}
            </button>
          )}
        </>
      )}
    </div>
  );
};
