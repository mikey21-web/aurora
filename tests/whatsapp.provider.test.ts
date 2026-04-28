import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../libraries/nestjs-libraries/src/integrations/social.abstract', () => ({
  SocialAbstract: class SocialAbstract {},
}));

let _counter = 0;
vi.mock('../libraries/nestjs-libraries/src/services/make.is', () => ({
  makeId: vi.fn((len: number) => `${++_counter}-${'x'.repeat(len - 2)}`),
}));

import { WhatsAppProvider } from '../libraries/nestjs-libraries/src/integrations/social/whatsapp.provider';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('WhatsAppProvider', () => {
  let provider: WhatsAppProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new WhatsAppProvider();
    process.env.WHATSAPP_APP_ID = 'test-app-id';
    process.env.WHATSAPP_APP_SECRET = 'test-app-secret';
    process.env.WHATSAPP_PHONE_NUMBER_ID = 'test-phone-id';
    process.env.BACKEND_INTERNAL_URL = 'http://localhost:3000';
  });

  describe('metadata', () => {
    it('has identifier "whatsapp"', () => expect(provider.identifier).toBe('whatsapp'));
    it('has name "WhatsApp Business"', () => expect(provider.name).toBe('WhatsApp Business'));
    it('has max length 4096', () => expect(provider.maxLength()).toBe(4096));
    it('is not web3', () => expect(provider.isWeb3).toBe(false));
    it('has required OAuth scopes', () => {
      expect(provider.scopes).toContain('whatsapp_business_messaging');
      expect(provider.scopes).toContain('whatsapp_business_management');
    });
  });

  describe('generateAuthUrl', () => {
    it('returns a Facebook OAuth URL with correct app ID', async () => {
      const result = await provider.generateAuthUrl();
      expect(result.url).toContain('facebook.com');
      expect(result.url).toContain('test-app-id');
      expect(result.url).toContain('whatsapp_business_messaging');
    });

    it('includes state for CSRF protection', async () => {
      const result = await provider.generateAuthUrl();
      expect(result.state).toBeDefined();
      expect(result.state.length).toBeGreaterThan(0);
    });

    it('generates unique state per call', async () => {
      const r1 = await provider.generateAuthUrl();
      const r2 = await provider.generateAuthUrl();
      expect(r1.state).not.toBe(r2.state);
    });
  });

  describe('authenticate', () => {
    it('exchanges code for token and returns user info', async () => {
      mockFetch
        .mockResolvedValueOnce({ json: () => Promise.resolve({ access_token: 'tok-123', expires_in: 5184000 }) })
        .mockResolvedValueOnce({ json: () => Promise.resolve({ id: 'wa-123', name: 'My Business' }) });

      const result = await provider.authenticate({ code: 'auth-code', codeVerifier: 'v' });
      expect(result.accessToken).toBe('tok-123');
      expect(result.name).toBe('My Business');
      expect(result.id).toBe('wa-123');
    });

    it('throws when access token missing', async () => {
      mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve({ error: 'invalid_code' }) });
      await expect(provider.authenticate({ code: 'bad', codeVerifier: 'v' }))
        .rejects.toThrow('WhatsApp authentication failed');
    });
  });

  describe('refreshToken', () => {
    it('exchanges old token for new access token', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ access_token: 'new-tok', expires_in: 5184000 }),
      });
      const result = await provider.refreshToken('old-tok');
      expect(result.accessToken).toBe('new-tok');
    });
  });

  describe('post', () => {
    const detail = {
      id: 'post-1', message: 'Hello from Aurora!',
      media: [], originalMedia: [], settings: {},
    } as any;

    it('sends a text message and returns success', async () => {
      mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve({ messages: [{ id: 'msg-1' }] }) });
      const results = await provider.post('recipient', 'token', [detail]);
      expect(results[0].status).toBe('success');
      expect(results[0].id).toBe('msg-1');
    });

    it('sends image message when media is present', async () => {
      const withMedia = { ...detail, media: [{ path: 'https://cdn.aurora.com/img.jpg', id: 'i1' }] };
      mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve({ messages: [{ id: 'msg-2' }] }) });
      await provider.post('recipient', 'token', [withMedia]);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.type).toBe('image');
      expect(body.image.link).toBe('https://cdn.aurora.com/img.jpg');
    });

    it('returns failed status on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const results = await provider.post('recipient', 'bad-token', [detail]);
      expect(results[0].status).toBe('failed');
    });

    it('handles multiple posts and maps postId correctly', async () => {
      const d2 = { ...detail, id: 'post-2', message: 'Post 2' };
      mockFetch
        .mockResolvedValueOnce({ json: () => Promise.resolve({ messages: [{ id: 'msg-1' }] }) })
        .mockResolvedValueOnce({ json: () => Promise.resolve({ messages: [{ id: 'msg-2' }] }) });
      const results = await provider.post('recipient', 'token', [detail, d2]);
      expect(results).toHaveLength(2);
      expect(results[0].postId).toBe('post-1');
      expect(results[1].postId).toBe('post-2');
    });
  });
});
