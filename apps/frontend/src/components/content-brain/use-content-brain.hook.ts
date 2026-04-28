'use client';

import useSWR from 'swr';
import { useCallback } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';

export interface ContentBrain {
  id: string;
  businessContext: string;
  targetAudience: string;
  tone: string;
  competitors: string[];
  uniqueValue: string;
  extraContext?: string;
  learnings: {
    approvalRate?: number;
    editRate?: number;
    discardRate?: number;
    totalFeedback?: number;
    lastUpdated?: string;
  };
}

export const useContentBrain = () => {
  const fetch = useFetch();
  const load = useCallback(async () => {
    const res = await fetch('/content-brain');
    if (!res.ok) return null;
    return res.json() as Promise<ContentBrain | null>;
  }, [fetch]);

  return useSWR<ContentBrain | null>('content-brain', load);
};
