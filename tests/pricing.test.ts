import { describe, it, expect } from 'vitest';
import {
  pricing,
  getPriceForCurrency,
} from '../libraries/nestjs-libraries/src/database/prisma/subscriptions/pricing';

describe('Pricing - Plan structure', () => {
  const expectedPlans = ['FREE', 'STANDARD', 'TEAM', 'PRO', 'ULTIMATE'];

  it('has all required plans', () => {
    expectedPlans.forEach((plan) => {
      expect(pricing[plan]).toBeDefined();
    });
  });

  it('each plan has required fields', () => {
    Object.values(pricing).forEach((plan) => {
      expect(plan).toHaveProperty('current');
      expect(plan).toHaveProperty('month_price');
      expect(plan).toHaveProperty('year_price');
      expect(plan).toHaveProperty('ai');
      expect(plan).toHaveProperty('posts_per_month');
      expect(plan).toHaveProperty('webhooks');
      expect(plan).toHaveProperty('autoPost');
    });
  });

  it('FREE plan has zero prices and no AI', () => {
    expect(pricing.FREE.month_price).toBe(0);
    expect(pricing.FREE.year_price).toBe(0);
    expect(pricing.FREE.month_price_inr).toBe(0);
    expect(pricing.FREE.ai).toBe(false);
    expect(pricing.FREE.autoPost).toBe(false);
  });

  it('STANDARD plan has India pricing at ₹499/mo', () => {
    expect(pricing.STANDARD.month_price_inr).toBe(499);
    expect(pricing.STANDARD.ai).toBe(true);
  });

  it('TEAM plan has India pricing at ₹1249/mo', () => {
    expect(pricing.TEAM.month_price_inr).toBe(1249);
    expect(pricing.TEAM.team_members).toBe(true);
  });

  it('PRO plan has India pricing at ₹1999/mo', () => {
    expect(pricing.PRO.month_price_inr).toBe(1999);
    expect(pricing.PRO.autoPost).toBe(true);
  });

  it('ULTIMATE plan has India pricing at ₹3999/mo', () => {
    expect(pricing.ULTIMATE.month_price_inr).toBe(3999);
    expect(pricing.ULTIMATE.channel).toBe(100);
  });

  it('plans are ordered cheapest to most expensive (USD)', () => {
    const prices = ['FREE', 'STANDARD', 'TEAM', 'PRO', 'ULTIMATE'].map(
      (k) => pricing[k].month_price
    );
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  it('yearly price is less than 12x monthly for paid plans', () => {
    ['STANDARD', 'TEAM', 'PRO', 'ULTIMATE'].forEach((plan) => {
      const p = pricing[plan];
      expect(p.year_price).toBeLessThan(p.month_price * 12);
    });
  });
});

describe('getPriceForCurrency', () => {
  describe('USD', () => {
    it('returns monthly USD price', () => {
      expect(getPriceForCurrency(pricing.STANDARD, 'USD', 'monthly')).toBe(pricing.STANDARD.month_price);
    });

    it('returns yearly USD price', () => {
      expect(getPriceForCurrency(pricing.STANDARD, 'USD', 'yearly')).toBe(pricing.STANDARD.year_price);
    });

    it('returns 0 for FREE plan', () => {
      expect(getPriceForCurrency(pricing.FREE, 'USD', 'monthly')).toBe(0);
    });
  });

  describe('INR', () => {
    it('returns ₹499 monthly for STANDARD', () => {
      expect(getPriceForCurrency(pricing.STANDARD, 'INR', 'monthly')).toBe(499);
    });

    it('returns ₹4788 yearly for STANDARD', () => {
      expect(getPriceForCurrency(pricing.STANDARD, 'INR', 'yearly')).toBe(4788);
    });

    it('returns ₹1999 monthly for PRO', () => {
      expect(getPriceForCurrency(pricing.PRO, 'INR', 'monthly')).toBe(1999);
    });

    it('returns ₹3999 monthly for ULTIMATE', () => {
      expect(getPriceForCurrency(pricing.ULTIMATE, 'INR', 'monthly')).toBe(3999);
    });

    it('returns 0 for FREE plan', () => {
      expect(getPriceForCurrency(pricing.FREE, 'INR', 'monthly')).toBe(0);
    });

    it('INR prices are always higher than USD in absolute value', () => {
      ['STANDARD', 'TEAM', 'PRO', 'ULTIMATE'].forEach((plan) => {
        const inr = getPriceForCurrency(pricing[plan], 'INR', 'monthly');
        const usd = getPriceForCurrency(pricing[plan], 'USD', 'monthly');
        expect(inr).toBeGreaterThan(usd);
      });
    });
  });

  describe('EUR', () => {
    it('returns EUR monthly for STANDARD', () => {
      expect(getPriceForCurrency(pricing.STANDARD, 'EUR', 'monthly')).toBe(pricing.STANDARD.month_price_eur);
    });

    it('returns EUR yearly for TEAM', () => {
      expect(getPriceForCurrency(pricing.TEAM, 'EUR', 'yearly')).toBe(pricing.TEAM.year_price_eur);
    });

    it('EUR prices are close to USD prices (within 20%)', () => {
      ['STANDARD', 'TEAM', 'PRO'].forEach((plan) => {
        const eur = getPriceForCurrency(pricing[plan], 'EUR', 'monthly');
        const usd = getPriceForCurrency(pricing[plan], 'USD', 'monthly');
        const ratio = eur / usd;
        expect(ratio).toBeGreaterThan(0.8);
        expect(ratio).toBeLessThan(1.2);
      });
    });
  });

  describe('fallback behavior', () => {
    it('falls back to USD * 83 when INR price not explicitly set', () => {
      const plan = { ...pricing.STANDARD, month_price_inr: undefined as number | undefined };
      const result = getPriceForCurrency(plan as any, 'INR', 'monthly');
      expect(result).toBe(Math.round(pricing.STANDARD.month_price * 83));
    });

    it('falls back to USD * 0.92 when EUR price not explicitly set', () => {
      const plan = { ...pricing.STANDARD, month_price_eur: undefined as number | undefined };
      const result = getPriceForCurrency(plan as any, 'EUR', 'monthly');
      expect(result).toBe(Math.round(pricing.STANDARD.month_price * 0.92));
    });
  });
});
