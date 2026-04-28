import { Injectable } from '@nestjs/common';
import { ContentBrainRepository } from '@gitroom/nestjs-libraries/database/prisma/content-brain/content-brain.repository';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';

export interface ContentBrainDto {
  businessContext: string;
  targetAudience: string;
  tone: string;
  competitors: string[];
  uniqueValue: string;
  extraContext?: string;
}

const aiModel = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-proj-',
  model: 'gpt-4.1',
  temperature: 0.5,
});

const hashtagsSchema = z.object({
  hashtags: z.array(z.string()).describe('List of relevant hashtags without the # symbol'),
});

const qualitySchema = z.object({
  score: z.number().min(1).max(10).describe('Quality score from 1 to 10'),
  strengths: z.array(z.string()).describe('What the post does well'),
  improvements: z.array(z.string()).describe('Specific improvements to make the post better'),
  verdict: z.string().describe('One sentence summary verdict'),
});

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

  async getBrainContext(organizationId: string): Promise<string | undefined> {
    const brain = await this._contentBrainRepository.getByOrgId(organizationId);
    if (!brain) return undefined;
    return [
      `Business: ${brain.businessContext}`,
      `Target Audience: ${brain.targetAudience}`,
      `Tone & Voice: ${brain.tone}`,
      `Unique Value: ${brain.uniqueValue}`,
      brain.extraContext ? `Extra Context: ${brain.extraContext}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  async saveBrain(organizationId: string, dto: ContentBrainDto) {
    return this._contentBrainRepository.upsert(organizationId, {
      ...dto,
      competitors: JSON.stringify(dto.competitors),
    });
  }

  async generateHashtags(content: string, platform?: string) {
    const structuredOutput = aiModel.withStructuredOutput(hashtagsSchema);
    const { hashtags } = await ChatPromptTemplate.fromTemplate(
      `
      You are a social media expert. Generate 5-10 highly relevant hashtags for the following post.
      - Use a mix of broad and niche hashtags
      - Include trending hashtags relevant to the topic
      - Do NOT include the # symbol
      - Optimize for discoverability on {platform}
      - Prioritize hashtags that will reach the target audience

      Post content:
      {content}
      `
    )
      .pipe(structuredOutput)
      .invoke({
        content,
        platform: platform || 'all social media platforms',
      });

    return { hashtags: hashtags.map((h) => `#${h.replace(/^#/, '')}`) };
  }

  async scoreContent(content: string, platform?: string) {
    const structuredOutput = aiModel.withStructuredOutput(qualitySchema);
    const result = await ChatPromptTemplate.fromTemplate(
      `
      You are a social media content expert. Score this post from 1-10 and give specific feedback.
      Platform: {platform}

      Scoring criteria:
      - Hook strength (does it grab attention in first 2 seconds?)
      - Clarity (is the message easy to understand?)
      - Engagement potential (will people comment/share/like?)
      - Call to action (is there a clear next step?)
      - Length (appropriate for the platform?)

      Post:
      {content}
      `
    )
      .pipe(structuredOutput)
      .invoke({
        content,
        platform: platform || 'general social media',
      });

    return result;
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

    const learnings = {
      approvalRate: Math.round((approved.length / recent.length) * 100),
      editRate: Math.round((edited.length / recent.length) * 100),
      discardRate: Math.round((discarded.length / recent.length) * 100),
      totalFeedback: recent.length,
      lastUpdated: new Date().toISOString(),
    };

    await this._contentBrainRepository.updateLearnings(
      organizationId,
      JSON.stringify(learnings)
    );
  }
}
