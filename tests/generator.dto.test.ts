import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { GeneratorDto } from '../libraries/nestjs-libraries/src/dtos/generator/generator.dto';

async function validateDto(plain: Record<string, unknown>) {
  const dto = plainToInstance(GeneratorDto, plain);
  return validate(dto);
}

const validBase = {
  research: 'This is a valid research string longer than 10 chars',
  isPicture: false,
  format: 'one_short',
  tone: 'personal',
};

describe('GeneratorDto validation', () => {
  describe('research field', () => {
    it('passes with a valid research string', async () => {
      expect(await validateDto(validBase)).toHaveLength(0);
    });

    it('fails when research is shorter than 10 chars', async () => {
      const errors = await validateDto({ ...validBase, research: 'short' });
      expect(errors.some((e) => e.property === 'research')).toBe(true);
    });

    it('fails when research is missing', async () => {
      const { research: _, ...rest } = validBase;
      const errors = await validateDto(rest as any);
      expect(errors.some((e) => e.property === 'research')).toBe(true);
    });
  });

  describe('format field', () => {
    const validFormats = ['one_short', 'one_long', 'thread_short', 'thread_long'];

    validFormats.forEach((format) => {
      it(`passes with format="${format}"`, async () => {
        const errors = await validateDto({ ...validBase, format });
        expect(errors.some((e) => e.property === 'format')).toBe(false);
      });
    });

    it('fails with an invalid format value', async () => {
      const errors = await validateDto({ ...validBase, format: 'invalid_format' });
      expect(errors.some((e) => e.property === 'format')).toBe(true);
    });
  });

  describe('tone field', () => {
    it('passes with tone="personal"', async () => {
      const errors = await validateDto({ ...validBase, tone: 'personal' });
      expect(errors.some((e) => e.property === 'tone')).toBe(false);
    });

    it('passes with tone="company"', async () => {
      const errors = await validateDto({ ...validBase, tone: 'company' });
      expect(errors.some((e) => e.property === 'tone')).toBe(false);
    });

    it('fails with invalid tone', async () => {
      const errors = await validateDto({ ...validBase, tone: 'robot' });
      expect(errors.some((e) => e.property === 'tone')).toBe(true);
    });
  });

  describe('language field (Phase 2)', () => {
    it('passes without language (optional)', async () => {
      const errors = await validateDto(validBase);
      expect(errors.some((e) => e.property === 'language')).toBe(false);
    });

    it('passes with Indian language codes', async () => {
      for (const lang of ['hi', 'ta', 'te', 'bn', 'mr']) {
        const errors = await validateDto({ ...validBase, language: lang });
        expect(errors.some((e) => e.property === 'language')).toBe(false);
      }
    });
  });

  describe('brainContext field (Phase 2)', () => {
    it('passes without brainContext (optional)', async () => {
      expect((await validateDto(validBase)).some((e) => e.property === 'brainContext')).toBe(false);
    });

    it('passes with brainContext string', async () => {
      const errors = await validateDto({
        ...validBase,
        brainContext: 'Business: AI scheduling\nAudience: Founders',
      });
      expect(errors.some((e) => e.property === 'brainContext')).toBe(false);
    });
  });

  describe('complete valid payloads', () => {
    it('passes full Phase 2 payload', async () => {
      const errors = await validateDto({
        research: 'Write a post about Aurora AI social media tool for Indian founders',
        isPicture: true,
        format: 'thread_long',
        tone: 'company',
        language: 'hi',
        brainContext: 'Business: AI social tool\nAudience: Indian startups',
      });
      expect(errors).toHaveLength(0);
    });
  });
});
