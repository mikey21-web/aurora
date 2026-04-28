import { Injectable } from '@nestjs/common';
import { ContentBrainRepository } from '@gitroom/nestjs-libraries/database/prisma/content-brain/content-brain.repository';

export interface ContentBrainDto {
  businessContext: string;
  targetAudience: string;
  tone: string;
  competitors: string[];
  uniqueValue: string;
  extraContext?: string;
}

@Injectable()
export class ContentBrainService {
  constructor(private _contentBrainRepository: ContentBrainRepository) {}

  async getBrain(organizationId: string) {
    const brain = await this._contentBrainRepository.getByOrgId(organizationId);
    if (!brain) return null;
    return {
      ...brain,
      competitors: JSON.parse(brain.competitors || '[]'),
      learnings: JSON.parse(brain.learnings || '{}'),
    };
  }

  async saveBrain(organizationId: string, dto: ContentBrainDto) {
    return this._contentBrainRepository.upsert(organizationId, {
      ...dto,
      competitors: JSON.stringify(dto.competitors),
    });
  }

  async recordFeedback(
    organizationId: string,
    data: {
      postId?: string;
      action: 'approved' | 'edited' | 'discarded';
      originalContent: string;
      editedContent?: string;
      platform?: string;
    }
  ) {
    const feedback = await this._contentBrainRepository.addFeedback({
      organizationId,
      ...data,
    });

    // Update learnings in the brain after enough feedback accumulates
    await this._updateLearnings(organizationId);

    return feedback;
  }

  async getFeedbackStats(organizationId: string) {
    const summary = await this._contentBrainRepository.getFeedbackSummary(organizationId);
    const recent = await this._contentBrainRepository.getRecentFeedback(organizationId, 20);
    return { summary, recent };
  }

  private async _updateLearnings(organizationId: string) {
    const recent = await this._contentBrainRepository.getRecentFeedback(organizationId, 50);
    if (recent.length < 5) return;

    const approved = recent.filter((f) => f.action === 'approved');
    const edited = recent.filter((f) => f.action === 'edited');
    const discarded = recent.filter((f) => f.action === 'discarded');

    const approvalRate = approved.length / recent.length;
    const editRate = edited.length / recent.length;
    const discardRate = discarded.length / recent.length;

    const learnings = {
      approvalRate: Math.round(approvalRate * 100),
      editRate: Math.round(editRate * 100),
      discardRate: Math.round(discardRate * 100),
      totalFeedback: recent.length,
      lastUpdated: new Date().toISOString(),
    };

    await this._contentBrainRepository.updateLearnings(
      organizationId,
      JSON.stringify(learnings)
    );
  }
}
