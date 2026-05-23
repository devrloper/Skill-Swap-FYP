// Credit pack definitions - can be used on both client and server
export const PAID_CREDIT_PACKS = {
  starter: { credits: 5, price: 499, label: "Starter Credits" },
  growth: { credits: 12, price: 999, label: "Growth Credits" },
  pro: { credits: 30, price: 1999, label: "Pro Credits" },
} as const;

export const INTERVIEW_PASS_CREDITS = 3;
export const SESSION_SCHEDULE_COST = 1;
export const SESSION_COMPLETION_BONUS = 1;
