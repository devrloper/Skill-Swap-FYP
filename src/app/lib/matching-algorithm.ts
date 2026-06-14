export type MatchableProfile = {
  id: string;
  fullName?: string;
  location?: string;
  bio?: string;
  rating?: number;
  reviewCount?: number;
  reviews?: unknown[];
  skills?: {
    learnSkills?: string[];
    teachSkills?: string[];
    customLearnSkills?: string[];
    customTeachSkills?: string[];
  };
  educations?: unknown[];
};

export type SkillMatchDirection = {
  skill: string;
  learnerId: string;
  teacherId: string;
};

export type AiMatchResult = {
  profile: MatchableProfile;
  score: number;
  label: "Excellent" | "Strong" | "Good" | "Low";
  reasons: string[];
  matchedSkills: string[];
  userCanLearn: string[];
  userCanTeach: string[];
};

const normalizeSkill = (skill: string) =>
  skill
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9+#.\s-]/g, "")
    .replace(/\s+/g, " ");

const uniqueSkills = (skills: Array<string | undefined>) => {
  const seen = new Map<string, string>();

  skills.forEach((skill) => {
    if (!skill?.trim()) return;
    const normalized = normalizeSkill(skill);
    if (!normalized || seen.has(normalized)) return;
    seen.set(normalized, skill.trim());
  });

  return Array.from(seen.entries()).map(([normalized, label]) => ({
    normalized,
    label,
  }));
};

const profileSkills = (profile: MatchableProfile) => {
  const skills = profile.skills || {};

  return {
    teach: uniqueSkills([
      ...(skills.teachSkills || []),
      ...(skills.customTeachSkills || []),
    ]),
    learn: uniqueSkills([
      ...(skills.learnSkills || []),
      ...(skills.customLearnSkills || []),
    ]),
  };
};

const overlap = (
  wanted: ReturnType<typeof uniqueSkills>,
  offered: ReturnType<typeof uniqueSkills>,
) => {
  const offeredMap = new Map(offered.map((skill) => [skill.normalized, skill.label]));

  return wanted
    .filter((skill) => offeredMap.has(skill.normalized))
    .map((skill) => offeredMap.get(skill.normalized) || skill.label);
};

const profileCompletenessScore = (profile: MatchableProfile) => {
  let score = 0;
  if (profile.fullName) score += 20;
  if (profile.bio) score += 20;
  if (profile.location) score += 20;
  if ((profile.educations || []).length > 0) score += 20;

  const skills = profileSkills(profile);
  if (skills.teach.length > 0 && skills.learn.length > 0) score += 20;

  return score;
};

const scoreLabel = (score: number): AiMatchResult["label"] => {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Strong";
  if (score >= 35) return "Good";
  return "Low";
};

export const calculateAiMatch = (
  currentUser: MatchableProfile,
  candidate: MatchableProfile,
): AiMatchResult => {
  const currentSkills = profileSkills(currentUser);
  const candidateSkills = profileSkills(candidate);

  const userCanLearn = overlap(currentSkills.learn, candidateSkills.teach);
  const userCanTeach = overlap(candidateSkills.learn, currentSkills.teach);
  const matchedSkills = Array.from(new Set([...userCanLearn, ...userCanTeach]));

  const currentLearningNeeds = Math.max(currentSkills.learn.length, 1);
  const candidateLearningNeeds = Math.max(candidateSkills.learn.length, 1);
  const userLearningScore = Math.min(userCanLearn.length / currentLearningNeeds, 1);
  const reciprocalScore = Math.min(userCanTeach.length / candidateLearningNeeds, 1);
  const mutualExchangeBonus = userCanLearn.length > 0 && userCanTeach.length > 0 ? 1 : 0;
  const locationScore =
    currentUser.location &&
    candidate.location &&
    currentUser.location.trim().toLowerCase() === candidate.location.trim().toLowerCase()
      ? 1
      : 0;
  const ratingScore =
    typeof candidate.rating === "number" && Number.isFinite(candidate.rating)
      ? Math.min(candidate.rating / 5, 1)
      : 0.5;
  const reviewScore = Math.min(
    (candidate.reviewCount || candidate.reviews?.length || 0) / 10,
    1,
  );
  const completenessScore = profileCompletenessScore(candidate) / 100;

  const score = Math.round(
    userLearningScore * 45 +
      reciprocalScore * 25 +
      mutualExchangeBonus * 10 +
      locationScore * 5 +
      ratingScore * 5 +
      reviewScore * 5 +
      completenessScore * 5,
  );

  const reasons: string[] = [];
  if (userCanLearn.length) {
    reasons.push(`You can learn ${userCanLearn.slice(0, 2).join(", ")} from them.`);
  }
  if (userCanTeach.length) {
    reasons.push(`You can teach them ${userCanTeach.slice(0, 2).join(", ")}.`);
  }
  if (mutualExchangeBonus) {
    reasons.push("This is a two-way skill swap.");
  }
  if (locationScore) {
    reasons.push("Same location improves scheduling fit.");
  }
  if (!reasons.length) {
    reasons.push("Low skill overlap with your current learning goals.");
  }

  return {
    profile: candidate,
    score,
    label: scoreLabel(score),
    reasons,
    matchedSkills,
    userCanLearn,
    userCanTeach,
  };
};

export const getAiMatches = (
  currentUser: MatchableProfile | null,
  candidates: MatchableProfile[],
) => {
  if (!currentUser) {
    return candidates.map((profile) => ({
      profile,
      score: 0,
      label: "Low" as const,
      reasons: ["Complete your profile to unlock AI matching."],
      matchedSkills: [],
      userCanLearn: [],
      userCanTeach: [],
    }));
  }

  return candidates
    .map((candidate) => calculateAiMatch(currentUser, candidate))
    .sort((a, b) => b.score - a.score || a.profile.fullName?.localeCompare(b.profile.fullName || "") || 0);
};
