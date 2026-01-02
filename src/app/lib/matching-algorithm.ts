// AI-powered skill matching algorithm
import { User, MatchScore, Skill } from './types';

/**
 * Calculate match score between two users based on complementary skills
 * Returns a score between 0 and 100
 */
export const calculateMatchScore = (user1: User, user2: User): number => {
  let score = 0;
  const weights = {
    skillMatch: 40,
    experienceLevel: 20,
    availability: 20,
    language: 10,
    location: 10,
  };

  // 1. Skill matching (40 points) - complementary skills
  const skillMatchScore = calculateSkillMatch(
    user1.skillsToTeach,
    user1.skillsToLearn,
    user2.skillsToTeach,
    user2.skillsToLearn
  );
  score += skillMatchScore * (weights.skillMatch / 100);

  // 2. Experience level compatibility (20 points)
  const experienceScore = calculateExperienceCompatibility(user1.experience, user2.experience);
  score += experienceScore * (weights.experienceLevel / 100);

  // 3. Availability overlap (20 points)
  const availabilityScore = calculateAvailabilityOverlap(user1.availability, user2.availability);
  score += availabilityScore * (weights.availability / 100);

  // 4. Common languages (10 points)
  const languageScore = calculateLanguageMatch(user1.languages, user2.languages);
  score += languageScore * (weights.language / 100);

  // 5. Location proximity (10 points)
  const locationScore = calculateLocationScore(user1.location, user2.location);
  score += locationScore * (weights.location / 100);

  return Math.round(score);
};

/**
 * Calculate skill match score based on complementary skills
 */
const calculateSkillMatch = (
  teach1: Skill[],
  learn1: Skill[],
  teach2: Skill[],
  learn2: Skill[]
): number => {
  let matches = 0;
  let totalPossible = 0;

  // User1 can teach what User2 wants to learn
  learn2.forEach(learnSkill => {
    totalPossible++;
    const matchingTeachSkill = teach1.find(
      teachSkill => teachSkill.name.toLowerCase() === learnSkill.name.toLowerCase()
    );
    if (matchingTeachSkill) {
      // Award more points if the teaching level is appropriate
      if (
        matchingTeachSkill.level === 'expert' ||
        (matchingTeachSkill.level === 'intermediate' && learnSkill.level !== 'expert')
      ) {
        matches += 1;
      } else {
        matches += 0.5;
      }
    }
  });

  // User2 can teach what User1 wants to learn
  learn1.forEach(learnSkill => {
    totalPossible++;
    const matchingTeachSkill = teach2.find(
      teachSkill => teachSkill.name.toLowerCase() === learnSkill.name.toLowerCase()
    );
    if (matchingTeachSkill) {
      if (
        matchingTeachSkill.level === 'expert' ||
        (matchingTeachSkill.level === 'intermediate' && learnSkill.level !== 'expert')
      ) {
        matches += 1;
      } else {
        matches += 0.5;
      }
    }
  });

  return totalPossible > 0 ? (matches / totalPossible) * 100 : 0;
};

/**
 * Calculate experience level compatibility
 */
const calculateExperienceCompatibility = (
  exp1: string,
  exp2: string
): number => {
  const expLevels: Record<string, number> = {
    beginner: 1,
    intermediate: 2,
    expert: 3,
  };

  const level1 = expLevels[exp1] || 0;
  const level2 = expLevels[exp2] || 0;

  // Perfect match if one level apart or same
  const difference = Math.abs(level1 - level2);
  if (difference === 0) return 100;
  if (difference === 1) return 70;
  return 40;
};

/**
 * Calculate availability overlap
 */
const calculateAvailabilityOverlap = (avail1: any, avail2: any): number => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  let overlappingDays = 0;

  days.forEach(day => {
    if (avail1[day] && avail1[day].length > 0 && avail2[day] && avail2[day].length > 0) {
      overlappingDays++;
    }
  });

  return (overlappingDays / days.length) * 100;
};

/**
 * Calculate language match score
 */
const calculateLanguageMatch = (lang1: string[], lang2: string[]): number => {
  if (!lang1.length || !lang2.length) return 50; // neutral if no data

  const commonLanguages = lang1.filter(l => 
    lang2.some(l2 => l2.toLowerCase() === l.toLowerCase())
  );

  return commonLanguages.length > 0 ? 100 : 30;
};

/**
 * Calculate location score
 */
const calculateLocationScore = (loc1?: string, loc2?: string): number => {
  if (!loc1 || !loc2) return 50; // neutral if no location data
  return loc1.toLowerCase() === loc2.toLowerCase() ? 100 : 50;
};

/**
 * Get top matches for a user
 */
export const getTopMatches = (
  currentUser: User,
  allUsers: User[],
  limit: number = 20
): MatchScore[] => {
  const matches: MatchScore[] = allUsers
    .filter(user => user.id !== currentUser.id)
    .map(user => {
      const score = calculateMatchScore(currentUser, user);
      const matchedSkills = findMatchedSkills(
        currentUser.skillsToTeach,
        currentUser.skillsToLearn,
        user.skillsToTeach,
        user.skillsToLearn
      );

      return {
        userId: user.id,
        score,
        matchedSkills,
        commonInterests: findCommonInterests(currentUser, user),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return matches;
};

/**
 * Find matched skills between two users
 */
const findMatchedSkills = (
  teach1: Skill[],
  learn1: Skill[],
  teach2: Skill[],
  learn2: Skill[]
): string[] => {
  const matched: string[] = [];

  learn1.forEach(learnSkill => {
    const found = teach2.find(
      teachSkill => teachSkill.name.toLowerCase() === learnSkill.name.toLowerCase()
    );
    if (found) matched.push(learnSkill.name);
  });

  learn2.forEach(learnSkill => {
    const found = teach1.find(
      teachSkill => teachSkill.name.toLowerCase() === learnSkill.name.toLowerCase()
    );
    if (found && !matched.includes(learnSkill.name)) {
      matched.push(learnSkill.name);
    }
  });

  return matched;
};

/**
 * Find common interests between users
 */
const findCommonInterests = (user1: User, user2: User): string[] => {
  const allSkills1 = [
    ...user1.skillsToTeach.map(s => s.name),
    ...user1.skillsToLearn.map(s => s.name),
  ];
  const allSkills2 = [
    ...user2.skillsToTeach.map(s => s.name),
    ...user2.skillsToLearn.map(s => s.name),
  ];

  return allSkills1.filter(skill =>
    allSkills2.some(s => s.toLowerCase() === skill.toLowerCase())
  );
};
