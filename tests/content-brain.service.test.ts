import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn().mockImplementation(() => ({
    withStructuredOutput: vi.fn().mockReturnValue({ invoke: vi.fn() }),
  })),
}));

vi.mock('@langchain/core/prompts', () => ({
  ChatPromptTemplate: {
    fromTemplate: vi.fn().mockReturnValue({
      pipe: vi.fn().mockReturnValue({ invoke: vi.fn() }),
    }),
  },
}));

vi.mock('zod', async () => {
  const actual = await vi.importActual('zod');
  return actual;
});

import { ContentBrainService } from '../libraries/nestjs-libraries/src/database/prisma/content-brain/content-brain.service';

const mockRepository = {
  getByOrgId: vi.fn(),
  upsert: vi.fn(),
  updateLearnings: vi.fn(),
  addFeedback: vi.fn(),
  getFeedbackSummary: vi.fn(),
  getRecentFeedback: vi.fn(),
};

describe('ContentBrainService', () => {
  let service: ContentBrainService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ContentBrainService(mockRepository as any);
  });

  describe('getBrain', () => {
    it('returns null when no brain exists', async () => {
      mockRepository.getByOrgId.mockResolvedValue(null);
      expect(await service.getBrain('org-1')).toBeNull();
    });

    it('parses competitors JSON from DB', async () => {
      mockRepository.getByOrgId.mockResolvedValue({
        id: '1', organizationId: 'org-1',
        businessContext: 'We build AI tools', targetAudience: 'Founders',
        tone: 'Direct', competitors: '["Buffer","Hootsuite"]',
        uniqueValue: 'AI-first', learnings: '{}',
      });
      const result = await service.getBrain('org-1');
      expect(result?.competitors).toEqual(['Buffer', 'Hootsuite']);
    });

    it('parses learnings JSON from DB', async () => {
      mockRepository.getByOrgId.mockResolvedValue({
        id: '1', organizationId: 'org-1',
        businessContext: 'Test', targetAudience: 'Test',
        tone: 'Test', competitors: '[]', uniqueValue: 'Test',
        learnings: '{"approvalRate":75,"totalFeedback":20}',
      });
      const result = await service.getBrain('org-1');
      expect(result?.learnings).toEqual({ approvalRate: 75, totalFeedback: 20 });
    });
  });

  describe('getBrainContext', () => {
    it('returns undefined when no brain exists', async () => {
      mockRepository.getByOrgId.mockResolvedValue(null);
      expect(await service.getBrainContext('org-1')).toBeUndefined();
    });

    it('returns formatted context string', async () => {
      mockRepository.getByOrgId.mockResolvedValue({
        businessContext: 'AI scheduling tool', targetAudience: 'Founders',
        tone: 'Direct', uniqueValue: 'AI-first', extraContext: 'India-focused',
      });
      const result = await service.getBrainContext('org-1');
      expect(result).toContain('Business: AI scheduling tool');
      expect(result).toContain('Target Audience: Founders');
      expect(result).toContain('Tone & Voice: Direct');
      expect(result).toContain('Extra Context: India-focused');
    });

    it('omits extraContext line when not set', async () => {
      mockRepository.getByOrgId.mockResolvedValue({
        businessContext: 'AI tool', targetAudience: 'Devs',
        tone: 'Technical', uniqueValue: 'Best DX', extraContext: null,
      });
      const result = await service.getBrainContext('org-1');
      expect(result).not.toContain('Extra Context');
    });
  });

  describe('saveBrain', () => {
    it('serializes competitors array to JSON', async () => {
      mockRepository.upsert.mockResolvedValue({ id: '1' });
      await service.saveBrain('org-1', {
        businessContext: 'Test', targetAudience: 'Devs',
        tone: 'Pro', competitors: ['Buffer', 'Later'], uniqueValue: 'Best',
      });
      expect(mockRepository.upsert).toHaveBeenCalledWith(
        'org-1',
        expect.objectContaining({ competitors: '["Buffer","Later"]' })
      );
    });

    it('handles empty competitors array', async () => {
      mockRepository.upsert.mockResolvedValue({ id: '1' });
      await service.saveBrain('org-1', {
        businessContext: 'Test', targetAudience: 'All',
        tone: 'Friendly', competitors: [], uniqueValue: 'Unique',
      });
      expect(mockRepository.upsert).toHaveBeenCalledWith(
        'org-1',
        expect.objectContaining({ competitors: '[]' })
      );
    });
  });

  describe('recordFeedback', () => {
    it('saves feedback with correct fields', async () => {
      mockRepository.addFeedback.mockResolvedValue({ id: 'fb-1' });
      mockRepository.getRecentFeedback.mockResolvedValue([]);
      await service.recordFeedback('org-1', {
        action: 'approved', originalContent: 'Test post', platform: 'twitter',
      });
      expect(mockRepository.addFeedback).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: 'org-1', action: 'approved', platform: 'twitter' })
      );
    });

    it('updates learnings when 5+ feedback records exist', async () => {
      mockRepository.addFeedback.mockResolvedValue({ id: 'fb-1' });
      mockRepository.getRecentFeedback.mockResolvedValue([
        { action: 'approved' }, { action: 'approved' }, { action: 'approved' },
        { action: 'edited' }, { action: 'discarded' },
      ]);
      mockRepository.updateLearnings.mockResolvedValue({});
      await service.recordFeedback('org-1', { action: 'approved', originalContent: 'Content' });
      expect(mockRepository.updateLearnings).toHaveBeenCalledWith('org-1', expect.any(String));
      const saved = JSON.parse(mockRepository.updateLearnings.mock.calls[0][1]);
      expect(saved.approvalRate).toBe(60);
      expect(saved.editRate).toBe(20);
      expect(saved.discardRate).toBe(20);
      expect(saved.totalFeedback).toBe(5);
    });

    it('skips learning update when fewer than 5 records', async () => {
      mockRepository.addFeedback.mockResolvedValue({ id: 'fb-1' });
      mockRepository.getRecentFeedback.mockResolvedValue([{ action: 'approved' }, { action: 'edited' }]);
      await service.recordFeedback('org-1', { action: 'approved', originalContent: 'Content' });
      expect(mockRepository.updateLearnings).not.toHaveBeenCalled();
    });
  });

  describe('getFeedbackStats', () => {
    it('returns summary and recent feedback', async () => {
      const summary = [{ action: 'approved', _count: { action: 10 } }];
      const recent = [{ id: '1', action: 'approved' }];
      mockRepository.getFeedbackSummary.mockResolvedValue(summary);
      mockRepository.getRecentFeedback.mockResolvedValue(recent);
      const result = await service.getFeedbackStats('org-1');
      expect(result.summary).toEqual(summary);
      expect(result.recent).toEqual(recent);
    });
  });
});
