type MaybeTimestamp = {
  toMillis?: () => number;
};

export function normalizeSkillValue(value: unknown) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function normalizeSkillKey(value: unknown) {
  return normalizeSkillValue(value).replace(/[^a-z0-9]/g, "");
}

function readSkillName(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const skill = value as Record<string, unknown>;
    return (
      skill.name ||
      skill.skill ||
      skill.title ||
      skill.label ||
      skill.value ||
      ""
    );
  }
  return "";
}

function collectSkills(...values: unknown[]) {
  return values
    .flatMap((value) => (Array.isArray(value) ? value : value ? [value] : []))
    .map(readSkillName)
    .map((skill) => normalizeSkillValue(skill))
    .filter(Boolean);
}

export function pairId(leftId: string, rightId: string) {
  return [leftId, rightId].sort().join("__");
}

export function toMillis(value: unknown): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  const timestamp = value as MaybeTimestamp;
  if (typeof timestamp?.toMillis === "function") {
    return Number(timestamp.toMillis()) || 0;
  }

  const maybeDate = value as { seconds?: number; nanoseconds?: number };
  if (typeof maybeDate?.seconds === "number") {
    return (
      maybeDate.seconds * 1000 +
      Math.floor((maybeDate.nanoseconds || 0) / 1_000_000)
    );
  }

  return 0;
}

export function extractProfileSkills(profile: Record<string, unknown>) {
  const skills = (profile.skills as Record<string, unknown> | undefined) || {};
  const teachSkills = collectSkills(
    skills.teachSkills,
    skills.customTeachSkills,
    skills.skillsToTeach,
    skills.teaching,
    skills.offer,
    profile.teachSkills,
    profile.customTeachSkills,
    profile.skillsToTeach,
    profile.teachingSkills,
    profile.offeredSkills,
    profile.skillsOffered,
    profile.canTeach,
  );

  const learnSkills = collectSkills(
    skills.learnSkills,
    skills.customLearnSkills,
    skills.skillsToLearn,
    skills.learning,
    skills.seek,
    profile.learnSkills,
    profile.customLearnSkills,
    profile.skillsToLearn,
    profile.learningSkills,
    profile.requestedSkills,
    profile.skillsWanted,
    profile.wantToLearn,
  );

  return {
    teach: Array.from(new Set(teachSkills)),
    learn: Array.from(new Set(learnSkills)),
  };
}

export function mergeUserProfileData(...sources: Array<Record<string, unknown> | null | undefined>) {
  return sources.reduce<Record<string, unknown>>((acc, source) => {
    if (source && typeof source === "object") {
      Object.assign(acc, source);
    }
    return acc;
  }, {});
}

export function hasCompletedProfile(profile: Record<string, unknown> | null | undefined) {
  if (!profile) return false;

  if (
    profile.enrolled ||
    profile.profileCompleted ||
    (Array.isArray(profile.completedSteps) && profile.completedSteps.includes(4))
  ) {
    return true;
  }

  const name = String(profile.fullName || profile.name || profile.displayName || "").trim();
  const hasAnyCoreField = Boolean(
    name &&
      (profile.email || profile.location || profile.phone || profile.bio || profile.photoURL || profile.avatar || profile.image),
  );

  return hasAnyCoreField;
}

export function hasInterviewCompleted(
  profile: Record<string, unknown> | null | undefined,
  interview: Record<string, unknown> | null | undefined = null,
) {
  if (!profile && !interview) return false;

  const status = String(profile?.interviewStatus || interview?.result || "").trim().toLowerCase();
  const score =
    typeof profile?.interviewScore === "number"
      ? profile.interviewScore
      : typeof interview?.score === "number"
        ? interview.score
        : null;

  if (status === "pass") return true;
  if (profile?.interview || interview) return true;
  if (typeof score === "number") return true;

  return false;
}

export function canSendSkillRequest(
  profile: Record<string, unknown> | null | undefined,
  interview: Record<string, unknown> | null | undefined = null,
) {
  return hasCompletedProfile(profile) && hasInterviewCompleted(profile, interview);
}

export function hasMatchingSkill(skills: string[], targetSkill: string) {
  const normalizedTarget = normalizeSkillValue(targetSkill);
  const targetKey = normalizeSkillKey(targetSkill);
  return skills.some((skill) => {
    const normalizedSkill = normalizeSkillValue(skill);
    return normalizedSkill === normalizedTarget || normalizeSkillKey(skill) === targetKey;
  });
}

export function buildRequestKey(
  senderId: string,
  receiverId: string,
  offeredSkill: string,
  requestedSkill: string,
) {
  return [
    senderId.trim(),
    receiverId.trim(),
    normalizeSkillValue(offeredSkill),
    normalizeSkillValue(requestedSkill),
  ].join("::");
}

export function isRequestExpired(request: Record<string, unknown>) {
  if (request.status !== "pending") return false;

  const expiresAt = toMillis(request.expiresAt);
  if (expiresAt) return expiresAt < Date.now();

  const createdAt = toMillis(request.createdAt);
  if (!createdAt) return false;

  return Date.now() - createdAt > 7 * 24 * 60 * 60 * 1000;
}
