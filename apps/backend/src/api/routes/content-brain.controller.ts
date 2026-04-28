import { Body, Controller, Get, Post } from '@nestjs/common';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';
import { ContentBrainService, ContentBrainDto } from '@gitroom/nestjs-libraries/database/prisma/content-brain/content-brain.service';

@ApiTags('Content Brain')
@Controller('/content-brain')
export class ContentBrainController {
  constructor(private _contentBrainService: ContentBrainService) {}

  @Get('/')
  getBrain(@GetOrgFromRequest() org: Organization) {
    return this._contentBrainService.getBrain(org.id);
  }

  @Post('/')
  saveBrain(
    @GetOrgFromRequest() org: Organization,
    @Body() body: ContentBrainDto
  ) {
    return this._contentBrainService.saveBrain(org.id, body);
  }

  @Post('/hashtags')
  generateHashtags(
    @Body() body: { content: string; platform?: string }
  ) {
    return this._contentBrainService.generateHashtags(body.content, body.platform);
  }

  @Post('/score')
  scoreContent(
    @Body() body: { content: string; platform?: string }
  ) {
    return this._contentBrainService.scoreContent(body.content, body.platform);
  }

  @Post('/feedback')
  recordFeedback(
    @GetOrgFromRequest() org: Organization,
    @Body()
    body: {
      postId?: string;
      action: 'approved' | 'edited' | 'discarded';
      originalContent: string;
      editedContent?: string;
      platform?: string;
    }
  ) {
    return this._contentBrainService.recordFeedback(org.id, body);
  }

  @Get('/feedback/stats')
  getFeedbackStats(@GetOrgFromRequest() org: Organization) {
    return this._contentBrainService.getFeedbackStats(org.id);
  }
}
