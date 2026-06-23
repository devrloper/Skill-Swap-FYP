import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/app/lib/firebaseAdmin";
import { getRequestUser } from "@/app/lib/serverAuth";
import type { LearnerJourney, LearnerQuestion, LearnerSkillResult, LearningModule } from "@/app/lib/learner";

const fallbackQuestions = (skill: string): LearnerQuestion[] => [
  { id: "q1", type: "multiple_choice", question: `Which approach is best when beginning ${skill}?`, options: ["Learn fundamentals and practise", "Skip directly to expert work", "Avoid feedback", "Only read theory"], answer: "Learn fundamentals and practise" },
  { id: "q2", type: "scenario", question: `You are stuck on a ${skill} task. What should you do first?`, options: ["Break it into smaller parts", "Abandon the skill", "Copy without understanding", "Ignore the problem"], answer: "Break it into smaller parts" },
  { id: "q3", type: "multiple_choice", question: "Which habit produces the most reliable learning progress?", options: ["Consistent deliberate practice", "One long session per year", "Avoiding mistakes", "Never reviewing work"], answer: "Consistent deliberate practice" },
  { id: "q4", type: "practical", question: `Which output best demonstrates practical ${skill} ability?`, options: ["A completed portfolio project", "An unread resource list", "A copied definition", "A blank document"], answer: "A completed portfolio project" },
  { id: "q5", type: "scenario", question: "Feedback reveals several weaknesses. What is the strongest response?", options: ["Prioritise and practise each gap", "Hide the feedback", "Change every goal", "Stop measuring progress"], answer: "Prioritise and practise each gap" },
];

async function askGemini(prompt: string) {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return String(data.candidates?.[0]?.content?.parts?.[0]?.text || "").replace(/```json|```/g, "").trim();
  } catch { return null; }
}

async function generateQuestions(skill: string, level: string) {
  const text = await askGemini(`Create exactly 5 ${level} mock test questions for ${skill}. Mix multiple-choice, scenario, and practical judgement questions. Return only JSON: [{"id":"q1","type":"multiple_choice","question":"...","options":["...","...","...","..."],"answer":"exact option"}].`);
  if (!text) return fallbackQuestions(skill);
  try {
    const parsed = JSON.parse(text) as LearnerQuestion[];
    return Array.isArray(parsed) && parsed.length === 5 && parsed.every((q) => q.question && q.options?.includes(q.answer)) ? parsed : fallbackQuestions(skill);
  } catch { return fallbackQuestions(skill); }
}

function buildModules(skill: string, level: string, hours: number): LearningModule[] {
  const normalized = skill.toLowerCase();
  const skillPlan =
    normalized.includes("web")
      ? {
          topics: [
            ["HTML structure", "CSS layout", "responsive design", "browser developer tools"],
            ["JavaScript basics", "DOM events", "forms", "fetching API data"],
            ["React or Next.js components", "state handling", "routing", "reusable UI"],
            ["deployment", "accessibility", "performance basics", "portfolio presentation"],
          ],
          resources: [
            ["MDN Web Docs HTML/CSS", "freeCodeCamp Responsive Web Design", "CSS-Tricks layout guides"],
            ["MDN JavaScript Guide", "JavaScript.info", "freeCodeCamp JavaScript exercises"],
            ["React.dev Learn", "Next.js Learn", "Frontend Mentor examples"],
            ["Vercel deployment docs", "web.dev accessibility", "Lighthouse reports"],
          ],
          practiceSources: [
            ["Frontend Mentor beginner challenges", "CodePen layout drills", "freeCodeCamp projects"],
            ["JavaScript30 exercises", "Codewars easy kata", "small DOM mini apps"],
            ["Frontend Mentor intermediate challenges", "GitHub sample repos", "local Next.js practice app"],
            ["Vercel preview deployment", "Lighthouse audit", "portfolio peer review"],
          ],
          projectIdeas: [
            ["Personal profile page", "responsive landing page", "service card layout"],
            ["To-do app", "quiz app", "weather app using an API"],
            ["Skill marketplace listing page", "dashboard with filters", "blog or portfolio site"],
            ["Complete portfolio website", "SkillSwap-style learner dashboard", "deployed capstone app"],
          ],
        }
      : normalized.includes("ui") || normalized.includes("ux")
        ? {
            topics: [
              ["user research basics", "personas", "problem statements", "design goals"],
              ["wireframes", "layout hierarchy", "spacing", "typography"],
              ["Figma components", "prototyping", "interaction states", "design systems"],
              ["usability testing", "case study writing", "portfolio presentation", "handoff notes"],
            ],
            resources: [
              ["Nielsen Norman Group articles", "Figma Learn", "Google UX course notes"],
              ["Material Design layout guidance", "Apple HIG basics", "Figma community wireframes"],
              ["Figma components tutorials", "Design Systems Handbook", "Mobbin screen references"],
              ["Maze usability testing guides", "UX case study templates", "Behance portfolio examples"],
            ],
            practiceSources: [
              ["Redesign one familiar app screen", "create user journey maps", "run a quick user interview"],
              ["Daily UI prompts", "wireframe a booking flow", "copy layout from a good app for practice"],
              ["Build a Figma component set", "prototype a signup flow", "create light and dark variants"],
              ["test with 3 users", "write a case study", "present before/after design decisions"],
            ],
            projectIdeas: [
              ["Learner onboarding flow", "mobile app home screen", "profile setup screen"],
              ["Course browsing wireframe", "mentor booking flow", "dashboard redesign"],
              ["Reusable button/input/card system", "interactive app prototype", "responsive web mockup"],
              ["Complete UX case study", "SkillSwap mobile prototype", "portfolio-ready product redesign"],
            ],
          }
        : normalized.includes("graphic")
          ? {
              topics: [
                ["composition", "color theory", "typography", "visual hierarchy"],
                ["brand identity", "logo basics", "social media layouts", "image editing"],
                ["layout systems", "poster design", "presentation design", "export formats"],
                ["portfolio curation", "client brief interpretation", "feedback revision", "final delivery"],
              ],
              resources: [
                ["Canva Design School", "Adobe tutorials", "Typography Handbook"],
                ["Behance brand identity projects", "Dribbble references", "Adobe Color"],
                ["Pinterest moodboards", "Figma community templates", "print/export guides"],
                ["portfolio case study examples", "brand guideline examples", "client brief samples"],
              ],
              practiceSources: [
                ["recreate 3 posters", "daily typography drills", "color palette studies"],
                ["design logo variations", "make Instagram carousel posts", "edit product images"],
                ["create event poster", "build presentation deck", "export for web and print"],
                ["take mock client feedback", "revise design set", "publish portfolio case study"],
              ],
              projectIdeas: [
                ["personal brand poster", "quote graphic pack", "simple logo concept"],
                ["brand identity kit", "social media campaign", "YouTube thumbnail set"],
                ["event poster series", "business flyer", "mini brand guideline"],
                ["complete brand identity project", "portfolio design case study", "client-ready design package"],
              ],
            }
          : normalized.includes("digital")
            ? {
                topics: [
                  ["marketing funnel", "audience research", "content pillars", "basic analytics"],
                  ["SEO basics", "social media strategy", "email marketing", "copywriting"],
                  ["campaign planning", "A/B testing", "paid ads basics", "conversion tracking"],
                  ["reporting", "optimization", "case study writing", "campaign presentation"],
                ],
                resources: [
                  ["Google Digital Garage", "HubSpot Academy", "Meta Blueprint basics"],
                  ["Google Search Central", "Mailchimp guides", "Copyblogger articles"],
                  ["Google Analytics Academy", "Meta Ads examples", "Ahrefs beginner SEO"],
                  ["Looker Studio tutorials", "marketing case studies", "campaign report templates"],
                ],
                practiceSources: [
                  ["audit a small business page", "write audience personas", "plan 7 content posts"],
                  ["write SEO titles", "draft email sequence", "create content calendar"],
                  ["design a mock campaign", "set tracking goals", "compare two ad copies"],
                  ["prepare campaign report", "recommend improvements", "present results"],
                ],
                projectIdeas: [
                  ["content plan for a cafe", "Instagram launch plan", "basic SEO audit"],
                  ["email welcome series", "blog keyword plan", "social media calendar"],
                  ["mock ad campaign", "landing page conversion plan", "campaign dashboard"],
                  ["complete marketing campaign case study", "growth plan for SkillSwap", "client-ready audit report"],
                ],
              }
            : {
                topics: [
                  [`core ${skill} vocabulary`, "basic concepts", "tools setup", "learning routine"],
                  ["intermediate techniques", "common mistakes", "guided examples", "feedback habits"],
                  ["real scenarios", "problem solving", "quality checklist", "independent practice"],
                  ["portfolio evidence", "presentation skills", "review and improvement", "next learning goals"],
                ],
                resources: [
                  ["official beginner guide", "YouTube beginner playlist", "community articles"],
                  ["intermediate tutorials", "worked examples", "expert blogs"],
                  ["practice worksheets", "sample projects", "community feedback forum"],
                  ["portfolio examples", "case study templates", "peer review checklist"],
                ],
                practiceSources: [
                  ["daily 30-minute drills", "beginner exercises", "copy a simple example"],
                  ["timed practice tasks", "community challenges", "review someone else's example"],
                  ["solve a realistic problem", "record your process", "ask for peer feedback"],
                  ["publish a final project", "present your work", "revise after feedback"],
                ],
                projectIdeas: [
                  [`beginner ${skill} sample`, "one-page learning notes", "mini demonstration"],
                  [`intermediate ${skill} exercise set`, "before/after improvement", "guided mini project"],
                  [`real-world ${skill} task`, "portfolio-ready sample", "problem-solution demo"],
                  [`complete ${skill} capstone`, "SkillSwap portfolio evidence", "client-style final project"],
                ],
              };
  const names = ["Foundations", "Core Practice", "Applied Skills", "Portfolio Project"];
  return names.map((name, index) => ({
    id: `module-${index + 1}`,
    title: `${skill}: ${name}`,
    description: index === 0 ? `Build the essential ${level.toLowerCase()} foundations for ${skill}.` : index === 3 ? `Combine your ${skill} skills into portfolio-ready evidence.` : `Apply progressively challenging ${skill} concepts through guided practice.`,
    milestone: `Week ${index + 1} - ${Math.max(1, Math.round(hours / 4))}-${Math.max(2, Math.round(hours / 2))} hours`,
    topics: skillPlan.topics[index],
    resources: skillPlan.resources[index],
    practiceSources: skillPlan.practiceSources[index],
    projectIdeas: skillPlan.projectIdeas[index],
    practiceTask: index === 3 ? `Create and present one complete ${skill} project from the ideas above.` : `Complete one focused ${skill} exercise and save evidence of what you practised.`,
    completed: false,
    practiceCompleted: false,
  }));
}

function makeAttemptId(userId: string) {
  return `attempt-${userId.slice(0, 6)}-${Date.now()}`;
}

function upsertSkillHistory(
  history: LearnerSkillResult[] | undefined,
  result: LearnerSkillResult,
) {
  const existing = Array.isArray(history) ? history : [];
  const index = existing.findIndex((item) => item.id === result.id);
  if (index === -1) return [...existing, result];
  return existing.map((item, itemIndex) => (itemIndex === index ? result : item));
}

async function requireLearner(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user?.uid) return null;
  const userDoc = await adminDb.collection("users").doc(user.uid).get();
  if (userDoc.data()?.role !== "learner") return null;
  return user;
}

export async function GET(req: NextRequest) {
  const user = await requireLearner(req);
  if (!user) return NextResponse.json({ error: "Learner authentication required" }, { status: 401 });
  const snap = await adminDb.collection("learnerJourneys").doc(user.uid).get();
  if (!snap.exists) return NextResponse.json({ journey: null });
  const journey = snap.data() as LearnerJourney;
  const activeAttemptId = journey.activeAttemptId || makeAttemptId(user.uid);
  const skillHistory = Array.isArray(journey.skillHistory) ? journey.skillHistory : [];
  // Normalize older records into the current five-step learner flow:
  // choose skill -> learning path -> comment -> practice -> mock test/certificate.
  const effectiveStage = journey.certified ? 5 : Math.min(Math.max(journey.stage, 1), 5);
  const shouldRebuildModules =
    Boolean(journey.skills?.[0]) &&
    (!journey.modules?.length ||
      journey.modules.some((module) => !module.topics?.length || !module.practiceSources?.length || !module.projectIdeas?.length));
  const modules = shouldRebuildModules
    ? buildModules(journey.skills[0], journey.level || "Beginner", journey.weeklyAvailability || 5)
    : journey.modules;
  if (effectiveStage !== journey.stage) {
    await snap.ref.set({ stage: effectiveStage, activeAttemptId, skillHistory, ...(shouldRebuildModules ? { modules } : {}) }, { merge: true });
  } else if (shouldRebuildModules) {
    await snap.ref.set({ activeAttemptId, skillHistory, modules }, { merge: true });
  } else if (!journey.activeAttemptId || !Array.isArray(journey.skillHistory)) {
    await snap.ref.set({ activeAttemptId, skillHistory }, { merge: true });
  }
  return NextResponse.json({ journey: { ...journey, activeAttemptId, skillHistory, stage: effectiveStage, modules } });
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireLearner(req);
    if (!user) return NextResponse.json({ error: "Learner authentication required" }, { status: 401 });
    const body = await req.json();
    const action = String(body.action || "");
    const ref = adminDb.collection("learnerJourneys").doc(user.uid);
    const current = (await ref.get()).data() as (LearnerJourney & { activeQuestions?: LearnerQuestion[] }) | undefined;

    if (action === "savePreferences") {
      const skills = Array.isArray(body.skills) ? body.skills.map(String).slice(0, 1) : [];
      if (!skills.length || !String(body.goals || "").trim()) return NextResponse.json({ error: "Choose a skill and add a learning goal." }, { status: 400 });
      const modules = buildModules(skills[0], body.level || "Beginner", Math.max(1, Math.min(40, Number(body.weeklyAvailability) || 5)));
      const journey: LearnerJourney = {
        activeAttemptId: makeAttemptId(user.uid),
        skills, level: body.level || "Beginner", weeklyAvailability: Math.max(1, Math.min(40, Number(body.weeklyAvailability) || 5)),
        goals: String(body.goals).trim(), stage: 2, modules, certified: false, xp: current?.xp || 50, streak: current?.streak || 1,
        badges: Array.from(new Set([...(current?.badges || []), "Journey Started"])), skillHistory: current?.skillHistory || [], updatedAt: new Date().toISOString(),
      };
      await ref.set({ ...journey, activeQuestions: [], createdAt: FieldValue.serverTimestamp() }, { merge: true });
      return NextResponse.json({ journey });
    }

    if (!current) return NextResponse.json({ error: "Complete skill selection first." }, { status: 400 });

    if (action === "startAnotherSkill") {
      if (typeof current.mockTestScore !== "number") return NextResponse.json({ error: "Finish the current mock test before starting another skill." }, { status: 400 });
      await ref.set({
        activeAttemptId: makeAttemptId(user.uid),
        skills: [],
        level: "Beginner",
        weeklyAvailability: 5,
        goals: "",
        stage: 1,
        learningPathComment: FieldValue.delete(),
        modules: [],
        mockTestScore: FieldValue.delete(),
        certified: false,
        certificateId: FieldValue.delete(),
        activeQuestions: [],
        skillHistory: current.skillHistory || [],
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return NextResponse.json({ ok: true });
    }

    if (action === "completeLearningPath") {
      await ref.set({ stage: Math.max(current.stage, 3), xp: current.xp + 75, updatedAt: new Date().toISOString() }, { merge: true });
      return NextResponse.json({ stage: 3 });
    }

    if (action === "submitLearningPathComment") {
      const learningPathComment = String(body.learningPathComment || "").trim();
      if (learningPathComment.length < 15) return NextResponse.json({ error: "Add a short comment confirming what you completed." }, { status: 400 });
      await ref.set({ learningPathComment, stage: Math.max(current.stage, 4), xp: current.xp + 75, badges: FieldValue.arrayUnion("Learning Path Completed"), updatedAt: new Date().toISOString() }, { merge: true });
      return NextResponse.json({ learningPathComment, stage: 4 });
    }

    if (action === "getMockTest") {
      const questions = await generateQuestions(current.skills[0], current.level);
      await ref.set({ activeQuestions: questions }, { merge: true });
      return NextResponse.json({ questions });
    }

    if (action === "submitTest") {
      const questions = current.activeQuestions?.length ? current.activeQuestions : fallbackQuestions(current.skills[0]);
      const answers = Array.isArray(body.answers) ? body.answers : [];
      const correct = questions.filter((q, i) => q.answer === answers[i]).length;
      const score = Math.round((correct / questions.length) * 100);
      const testType = body.testType || "mock";
      if (testType === "mock") {
        const passed = score >= 70;
        const certificateId = passed ? (current.certificateId || `SS-${user.uid.slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-6)}`) : null;
        const skillHistory = upsertSkillHistory(current.skillHistory, {
          id: current.activeAttemptId || makeAttemptId(user.uid),
          skill: current.skills[0],
          level: current.level,
          score,
          status: passed ? "passed" : "failed",
          certificateId,
          completedAt: new Date().toISOString(),
        });
        await ref.set({
          mockTestScore: score,
          certified: passed,
          certificateId,
          stage: 5,
          xp: current.xp + (passed ? 500 : 100),
          badges: passed ? FieldValue.arrayUnion("Skill Certified", "Mock Test Passed") : current.badges,
          skillHistory,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        return NextResponse.json({ score, passed, certificateId });
      }
      return NextResponse.json({ error: "Only the mock test is available in this learner flow." }, { status: 400 });
    }

    if (action === "completePractice") {
      const moduleId = String(body.moduleId);
      const evidence = String(body.evidence || "").trim();
      if (evidence.length < 20) return NextResponse.json({ error: "Describe your work in at least 20 characters." }, { status: 400 });
      const aiFeedback = await askGemini(`You are a concise ${current.skills[0]} coach. Give two sentences of constructive feedback on this learner's practice evidence, including one strength and one next improvement: ${evidence}`);
      const feedback = aiFeedback || "Good practical evidence. Next, refine the result using feedback and explain one decision you made.";
      const modules = current.modules.map((m) => m.id === moduleId ? { ...m, completed: true, practiceCompleted: true, feedback } : m);
      const done = modules.filter((m) => m.practiceCompleted).length;
      await ref.set({ modules, stage: done === modules.length ? 5 : 4, xp: current.xp + 100, streak: current.streak + 1, updatedAt: new Date().toISOString() }, { merge: true });
      return NextResponse.json({ modules, feedback: modules.find((m) => m.id === moduleId)?.feedback });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Learner journey error", error);
    return NextResponse.json({ error: "Could not update learning journey" }, { status: 500 });
  }
}
