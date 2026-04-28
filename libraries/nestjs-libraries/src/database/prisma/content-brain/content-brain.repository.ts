import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

@Injectable()
export class ContentBrainRepository {
  constructor(
    private _contentBrain: PrismaRepository<'contentBrain'>,
    private _postFeedback: PrismaRepository<'postFeedback'>
  ) {}

  getByOrgId(organizationId: string) {
    return this._contentBrain.model.contentBrain.findUnique({
      where: { organizationId },
    });
  }

  upsert(
    organizationId: string,
    data: {
      businessContext: string;
      targetAudience: string;
      tone: string;
      competitors: string;
      uniqueValue: string;
      extraContext?: string;
    }
  ) {
    return this._contentBrain.model.contentBrain.upsert({
      where: { organizationId },
      create: { organizationId, ...data },
      update: data,
    });
  }

  updateLearnings(organizationId: string, learnings: string) {
    return this._contentBrain.model.contentBrain.update({
      where: { organizationId },
      data: { learnings },
    });
  }

  addFeedback(data: {
    organizationId: string;
    postId?: string;
    action: 'approved' | 'edited' | 'discarded';
    originalContent: string;
    editedContent?: string;
    platform?: string;
  }) {
    return this._postFeedback.model.postFeedback.create({ data });
  }

  getFeedbackSummary(organizationId: string) {
    return this._postFeedback.model.postFeedback.groupBy({
      by: ['action'],
      where: { organizationId },
      _count: { action: true },
    });
  }

  getRecentFeedback(organizationId: string, limit = 50) {
    return this._postFeedback.model.postFeedback.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
