import {
  AuthTokenDetails,
  PostDetails,
  PostResponse,
  SocialProvider,
} from '@gitroom/nestjs-libraries/integrations/social/social.integrations.interface';
import { makeId } from '@gitroom/nestjs-libraries/services/make.is';
import { SocialAbstract } from '@gitroom/nestjs-libraries/integrations/social.abstract';

export class WhatsAppProvider extends SocialAbstract implements SocialProvider {
  identifier = 'whatsapp';
  name = 'WhatsApp Business';
  isBetweenSteps = false;
  isWeb3 = false;
  scopes = ['whatsapp_business_messaging', 'whatsapp_business_management'];
  editor = 'normal' as const;

  maxLength() {
    return 4096;
  }

  async refreshToken(refresh_token: string): Promise<AuthTokenDetails> {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.WHATSAPP_APP_ID}&client_secret=${process.env.WHATSAPP_APP_SECRET}&fb_exchange_token=${refresh_token}`
    );
    const data = await res.json() as any;
    return {
      accessToken: data.access_token,
      refreshToken: data.access_token,
      expiresIn: data.expires_in || 5184000,
      id: '',
      name: '',
      picture: '',
      username: '',
    };
  }

  async generateAuthUrl() {
    const state = makeId(17);
    const scopes = this.scopes.join(',');
    const redirectUri = encodeURIComponent(
      `${process.env.BACKEND_INTERNAL_URL}/integrations/social/whatsapp/callback`
    );
    const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${process.env.WHATSAPP_APP_ID}&redirect_uri=${redirectUri}&state=${state}&scope=${scopes}`;
    return {
      url,
      codeVerifier: makeId(10),
      state,
    };
  }

  async authenticate(params: { code: string; codeVerifier: string; refresh?: string }) {
    const redirectUri = encodeURIComponent(
      `${process.env.BACKEND_INTERNAL_URL}/integrations/social/whatsapp/callback`
    );
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${process.env.WHATSAPP_APP_ID}&redirect_uri=${redirectUri}&client_secret=${process.env.WHATSAPP_APP_SECRET}&code=${params.code}`
    );
    const tokenData = await tokenRes.json() as any;
    if (!tokenData.access_token) {
      throw new Error('WhatsApp authentication failed');
    }

    // Get the WhatsApp Business Account phone number info
    const phoneRes = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${tokenData.access_token}`
    );
    const phoneData = await phoneRes.json() as any;

    return {
      id: phoneData.id,
      name: phoneData.name || 'WhatsApp Business',
      accessToken: tokenData.access_token,
      refreshToken: tokenData.access_token,
      expiresIn: tokenData.expires_in || 5184000,
      picture: '',
      username: phoneData.id,
    };
  }

  async post(
    id: string,
    accessToken: string,
    postDetails: PostDetails[]
  ): Promise<PostResponse[]> {
    const results: PostResponse[] = [];

    for (const detail of postDetails) {
      try {
        // WhatsApp Business API — send text message to broadcast list or group
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const payload: any = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: id,
          type: 'text',
          text: { body: detail.message },
        };

        if (detail.media?.[0]?.path) {
          payload.type = 'image';
          payload.image = {
            link: detail.media[0].path,
            caption: detail.message,
          };
          delete payload.text;
        }

        const res = await fetch(
          `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          }
        );
        const data = await res.json() as any;
        results.push({
          id: data.messages?.[0]?.id || makeId(10),
          postId: detail.id,
          releaseURL: '',
          status: data.messages ? 'success' : 'failed',
        });
      } catch (err) {
        results.push({
          id: makeId(10),
          postId: detail.id,
          releaseURL: '',
          status: 'failed',
        });
      }
    }

    return results;
  }
}
