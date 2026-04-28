export interface PricingInnerInterface {
  current: string;
  month_price: number;
  year_price: number;
  month_price_inr?: number;
  year_price_inr?: number;
  month_price_eur?: number;
  year_price_eur?: number;
  channel?: number;
  posts_per_month: number;
  team_members: boolean;
  community_features: boolean;
  featured_by_gitroom: boolean;
  ai: boolean;
  import_from_channels: boolean;
  image_generator?: boolean;
  image_generation_count: number;
  generate_videos: number;
  public_api: boolean;
  webhooks: number;
  autoPost: boolean;
}

export interface PricingInterface {
  [key: string]: PricingInnerInterface;
}

export type SupportedCurrency = 'USD' | 'INR' | 'EUR';

export function getPriceForCurrency(
  plan: PricingInnerInterface,
  currency: SupportedCurrency,
  billing: 'monthly' | 'yearly'
): number {
  if (currency === 'INR') {
    return billing === 'monthly'
      ? (plan.month_price_inr ?? Math.round(plan.month_price * 83))
      : (plan.year_price_inr ?? Math.round(plan.year_price * 83));
  }
  if (currency === 'EUR') {
    return billing === 'monthly'
      ? (plan.month_price_eur ?? Math.round(plan.month_price * 0.92))
      : (plan.year_price_eur ?? Math.round(plan.year_price * 0.92));
  }
  return billing === 'monthly' ? plan.month_price : plan.year_price;
}

export const pricing: PricingInterface = {
  FREE: {
    current: 'FREE',
    month_price: 0,
    year_price: 0,
    month_price_inr: 0,
    year_price_inr: 0,
    month_price_eur: 0,
    year_price_eur: 0,
    channel: 0,
    image_generation_count: 0,
    posts_per_month: 0,
    team_members: false,
    community_features: false,
    featured_by_gitroom: false,
    ai: false,
    import_from_channels: false,
    image_generator: false,
    public_api: false,
    webhooks: 0,
    autoPost: false,
    generate_videos: 0,
  },
  STANDARD: {
    current: 'STANDARD',
    month_price: 6,
    year_price: 58,
    month_price_inr: 499,
    year_price_inr: 4788,
    month_price_eur: 6,
    year_price_eur: 55,
    channel: 5,
    posts_per_month: 400,
    image_generation_count: 20,
    team_members: false,
    ai: true,
    community_features: false,
    featured_by_gitroom: false,
    import_from_channels: true,
    image_generator: false,
    public_api: true,
    webhooks: 2,
    autoPost: false,
    generate_videos: 3,
  },
  TEAM: {
    current: 'TEAM',
    month_price: 15,
    year_price: 144,
    month_price_inr: 1249,
    year_price_inr: 11988,
    month_price_eur: 14,
    year_price_eur: 132,
    channel: 10,
    posts_per_month: 1000000,
    image_generation_count: 100,
    community_features: true,
    team_members: true,
    featured_by_gitroom: true,
    ai: true,
    import_from_channels: true,
    image_generator: true,
    public_api: true,
    webhooks: 10,
    autoPost: true,
    generate_videos: 10,
  },
  PRO: {
    current: 'PRO',
    month_price: 25,
    year_price: 240,
    month_price_inr: 1999,
    year_price_inr: 19188,
    month_price_eur: 23,
    year_price_eur: 220,
    channel: 30,
    posts_per_month: 1000000,
    image_generation_count: 300,
    community_features: true,
    team_members: true,
    featured_by_gitroom: true,
    ai: true,
    import_from_channels: true,
    image_generator: true,
    public_api: true,
    webhooks: 30,
    autoPost: true,
    generate_videos: 30,
  },
  ULTIMATE: {
    current: 'ULTIMATE',
    month_price: 49,
    year_price: 470,
    month_price_inr: 3999,
    year_price_inr: 38388,
    month_price_eur: 45,
    year_price_eur: 432,
    channel: 100,
    posts_per_month: 1000000,
    image_generation_count: 500,
    community_features: true,
    team_members: true,
    featured_by_gitroom: true,
    ai: true,
    import_from_channels: true,
    image_generator: true,
    public_api: true,
    webhooks: 10000,
    autoPost: true,
    generate_videos: 60,
  },
};
