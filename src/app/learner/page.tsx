"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/app/lib/firebase";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  Award,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Code2,
  Flame,
  Gauge,
  GraduationCap,
  ListChecks,
  LockKeyhole,
  LogOut,
  Menu,
  Medal,
  Search,
  Target,
  Trophy,
} from "lucide-react";
import {
  EMPTY_JOURNEY,
  LEARNER_SKILLS,
  type LearnerJourney,
  type LearnerQuestion,
  type LearnerSkillResult,
} from "@/app/lib/learner";

const journeySteps = [
  ["Choose Skill", Target],
  ["Learning Path", GraduationCap],
  ["Completion Comment", Check],
  ["Practice", ListChecks],
  ["Mock Test & Certificate", ClipboardCheck],
] as const;

const navItems = [
  ["Choose Skill", Target],
  ["Learning Path", GraduationCap],
  ["Completion Comment", Check],
  ["Practice", ListChecks],
  ["Mock Test & Certificate", Award],
] as const;

type ProgressDetails = {
  overall: number;
  skillSelection: number;
  learningPath: number;
  completionComment: number;
  practice: number;
  mockTest: number;
  certificate: number;
};

export default function LearnerPage() {
  const router = useRouter();
  const [journey, setJourney] = useState<LearnerJourney>(EMPTY_JOURNEY);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [level, setLevel] = useState<LearnerJourney["level"]>("Beginner");
  const [hours, setHours] = useState(5);
  const [goals, setGoals] = useState("");
  const [questions, setQuestions] = useState<LearnerQuestion[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [learningPathComment, setLearningPathComment] = useState("");
  const [testType, setTestType] = useState<"mock">("mock");
  const [practiceId, setPracticeId] = useState<string | null>(null);
  const [evidence, setEvidence] = useState("");
  const canStartAnotherSkill = typeof journey.mockTestScore === "number";

  const api = useCallback(async (body?: object) => {
    const response = await fetch(
      "/api/learner-journey",
      body
        ? {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        : { cache: "no-store" },
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Something went wrong");
    return data;
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await api();
      if (data.journey) {
        setJourney({ ...EMPTY_JOURNEY, ...data.journey });
        setSelectedSkills(data.journey.skills || []);
        setLevel(data.journey.level || "Beginner");
        setHours(data.journey.weeklyAvailability || 5);
        setGoals(data.journey.goals || "");
        setLearningPathComment(data.journey.learningPathComment || "");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load journey");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(
    () =>
      onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        if (currentUser) refresh();
        else router.push("/signin?next=/learner");
      }),
    [refresh, router],
  );

  const logout = async () => {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await signOut(auth);
      router.replace("/signin");
    } finally {
      setBusy(false);
    }
  };

  const act = async (
    body: object,
    onDone?: (data: Record<string, unknown>) => void,
  ) => {
    setBusy(true);
    setError("");
    try {
      const data = await api(body);
      onDone?.(data);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const startTest = async (type: "mock") => {
    setBusy(true);
    setError("");
    try {
      const data = await api({ action: "getMockTest" });
      setQuestions(data.questions);
      setAnswers([]);
      setTestType(type);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create test");
    } finally {
      setBusy(false);
    }
  };

  const startAnotherSkill = () =>
    act({ action: "startAnotherSkill" }, () => {
      setSelectedSkills([]);
      setCustomSkill("");
      setLevel("Beginner");
      setHours(5);
      setGoals("");
      setLearningPathComment("");
      setQuestions([]);
      setAnswers([]);
      setActiveTab(1);
    });

  const progressDetails = useMemo<ProgressDetails>(() => {
    const practice = journey.modules.length
      ? Math.round(
          (journey.modules.filter((m) => m.practiceCompleted).length /
            journey.modules.length) *
            100,
        )
      : 0;
    const details = {
      skillSelection: journey.skills.length ? 100 : 0,
      learningPath: journey.stage >= 3 ? 100 : journey.stage >= 2 ? 50 : 0,
      completionComment: journey.learningPathComment ? 100 : 0,
      practice,
      mockTest: typeof journey.mockTestScore === "number" ? 100 : 0,
      certificate: journey.certified ? 100 : 0,
    };
    return {
      ...details,
      overall: Math.round(
        (details.skillSelection +
          details.learningPath +
          details.completionComment +
          details.practice +
          details.mockTest) /
          5,
      ),
    };
  }, [journey]);
  const progress = progressDetails.overall;
  const activeModule = journey.modules.find(
    (module) => !module.practiceCompleted,
  );
  const name = user?.displayName?.split(" ")[0] || "Learner";
  const currentSkill = journey.skills[0] || "Web Development";
  const currentStep = journey.certified
    ? 5
    : Math.min(5, Math.max(1, journey.stage));

  useEffect(() => {
    if (journey.stage >= 5) setTestType("mock");
  }, [journey.stage]);

  const openStep = (step: number) => {
    if (step > currentStep) return;
    setMobileNav(false);
    setActiveTab(step);
    if (step === 5 && !journey.certified) void startTest("mock");
  };

  const runSearch = () => {
    const value = search.toLowerCase();
    const match =
      value.includes("mock") || value.includes("certificate")
        ? 5
        : value.includes("practice")
          ? 4
          : value.includes("comment") || value.includes("complete")
            ? 3
            : value.includes("path")
              ? 2
              : 1;
    openStep(Math.min(match, currentStep));
  };

  if (loading)
    return (
      <main className="grid min-h-screen place-items-center bg-[#fafafa] text-slate-900">
        <div className="animate-pulse font-semibold text-fuchsia-600">
          Preparing your learning journey…
        </div>
      </main>
    );

  return (
    <main className="learner-light min-h-screen bg-[#fafafa] text-slate-950 selection:bg-fuchsia-500/25">
      <div className="mx-auto flex min-h-screen max-w-[1920px] overflow-hidden bg-white">
        <Sidebar
          currentStep={currentStep}
          activeTab={activeTab}
          mobileOpen={mobileNav}
          close={() => setMobileNav(false)}
          logout={logout}
          busy={busy}
          onSelect={openStep}
          onDashboard={() => { setActiveTab(0); setMobileNav(false); }}
        />

        <div className="min-w-0 flex-1">
          <header className="learner-header flex h-[64px] items-center gap-4 border-b border-slate-200 bg-white px-4 lg:px-6">
            <button
              onClick={() => setMobileNav(true)}
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm lg:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="ml-auto hidden w-full max-w-[500px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-400 shadow-sm md:flex">
              <Search size={17} />
              <input
                aria-label="Search learner journey"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") runSearch();
                }}
                placeholder="Search your learner journey..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-3 text-sm font-semibold"
              >
                <Avatar user={user} />
                <span className="hidden sm:block">{name}</span>
                <ChevronDown size={15} className="text-slate-400" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-white/10 bg-[#101a31] p-2 shadow-2xl">
                  <p className="truncate border-b border-white/10 px-3 py-2 text-xs text-slate-400">
                    {user?.email}
                  </p>
                  <button
                    disabled={busy}
                    onClick={logout}
                    className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-400 hover:bg-white/5"
                  >
                    <LogOut size={16} /> Log out
                  </button>
                </div>
              )}
            </div>
          </header>

          <div className="learner-content bg-[#fcfcfd] p-4 lg:p-6">
            <div className="mb-5">
              <h1 className="text-2xl font-bold tracking-tight">
                {activeTab === 0 ? <>Welcome back, {name}!{" "}</> : journeySteps[activeTab - 1][0]}
                <span className="inline-block origin-bottom-right animate-[wave_1.8s_ease-in-out_infinite]">
                  👋
                </span>
              </h1>
              <p className="mt-1 text-sm text-slate-400">{activeTab === 0 ? "Keep learning, keep growing. You're on the right path!" : `Step ${activeTab} of your ${currentSkill} learning journey`}</p>
            </div>
            {error && (
              <div className="mb-4 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
                {error}
              </div>
            )}

            <div className={`${activeTab === 0 ? "grid" : "hidden"} gap-4 xl:grid-cols-[minmax(0,1fr)_300px]`}>
              <section className="min-w-0 space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                  <Stat
                    icon={<Code2 />}
                    label="Current Skill"
                    value={currentSkill}
                    tone="violet"
                  />
                  <Stat
                    icon={<Gauge />}
                    label="Current Level"
                    value={level}
                    tone="cyan"
                  />
                  <Stat
                    icon={<Medal />}
                    label="XP Points"
                    value={`${journey.xp || 1250} XP`}
                    tone="amber"
                  />
                  <Stat
                    icon={<Flame />}
                    label="Learning Streak"
                    value={`${journey.streak || 12} Days 🔥`}
                    tone="rose"
                  />
                  <Stat
                    icon={<Trophy />}
                    label="Rank"
                    value="#23"
                    tone="amber"
                  />
                </div>

                <Panel className="p-4 lg:p-5">
                  <h2 className="font-semibold">Your Learning Journey</h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Track your progress from beginner to skilled professional
                  </p>
                  <div className="mt-7 grid grid-cols-2 gap-y-6 sm:grid-cols-3 md:grid-cols-5">
                    {journeySteps.map(([label, Icon], i) => {
                      const done = i + 1 < currentStep,
                        active = i + 1 === currentStep;
                      return (
                        <button
                          type="button"
                          disabled={i + 1 > currentStep}
                          onClick={() => openStep(i + 1)}
                          key={label}
                          className="relative flex min-w-0 flex-col items-center text-center before:absolute before:left-0 before:top-5 before:h-px before:w-1/2 before:bg-slate-200 after:absolute after:right-0 after:top-5 after:h-px after:w-1/2 after:bg-slate-200 first:before:hidden last:after:hidden disabled:cursor-not-allowed"
                        >
                          <div
                            className={`relative z-10 grid h-10 w-10 place-items-center rounded-full border ${active ? "border-fuchsia-500 bg-gradient-to-br from-purple-700 to-pink-500 text-white shadow-[0_8px_20px_rgba(192,38,211,.25)]" : done ? "border-emerald-200 bg-emerald-100 text-emerald-600" : "border-slate-200 bg-slate-50 text-slate-700"}`}
                          >
                            {done ? <Check size={19} /> : <Icon size={18} />}
                          </div>
                          <span className="mt-3 text-[10px] text-slate-400">
                            Step {i + 1}
                          </span>
                          <span
                            className={`mt-1 text-[11px] leading-tight ${active ? "text-violet-300" : "text-slate-200"}`}
                          >
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-5 flex flex-col gap-3 rounded-xl border border-fuchsia-100 bg-gradient-to-r from-fuchsia-50 to-pink-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold">
                        <span className="text-fuchsia-700">
                          You are on Step {currentStep}:
                        </span>{" "}
                        {journeySteps[currentStep - 1][0]}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Follow the path, practise, and pass the mock test at
                        70% or higher to earn your certificate.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        document
                          .getElementById("action-panel")
                          ?.scrollIntoView({ behavior: "smooth" });
                        if (currentStep === 5 && !journey.certified)
                          void startTest("mock");
                      }}
                      className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-700 to-pink-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-fuchsia-200"
                    >
                      {journey.certified ? "View Certificate" : "Continue"}{" "}
                      <ChevronRight size={16} />
                    </button>
                    {canStartAnotherSkill && (
                      <button
                        disabled={busy}
                        onClick={startAnotherSkill}
                        className="flex shrink-0 items-center justify-center rounded-lg border border-fuchsia-200 bg-white px-5 py-2.5 text-xs font-semibold text-fuchsia-700 disabled:opacity-50"
                      >
                        Learn another skill
                      </button>
                    )}
                  </div>
                </Panel>

                <Panel className="p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="font-semibold">Skill Results</h2>
                      <p className="mt-1 text-xs text-slate-500">
                        Completed and failed mock-test attempts stay here when
                        you start a new skill.
                      </p>
                    </div>
                    {canStartAnotherSkill && (
                      <button
                        disabled={busy}
                        onClick={startAnotherSkill}
                        className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        Start new skill
                      </button>
                    )}
                  </div>
                  {journey.skillHistory.length ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {journey.skillHistory
                        .slice()
                        .reverse()
                        .map((result) => (
                          <SkillResultCard key={result.id} result={result} />
                        ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                      No skill results yet. After the mock test, your passed or
                      failed skill will appear here.
                    </div>
                  )}
                </Panel>

                <div className="grid items-stretch gap-6 md:grid-cols-2 xl:w-[calc(100%+316px)] xl:grid-cols-3 xl:gap-7">
                  <Panel className="min-h-[320px] min-w-0 overflow-hidden p-5">
                    <CardTitle title="Continue Learning" />
                    <div className="mt-4 rounded-xl border border-violet-300 bg-gradient-to-br from-cyan-50 to-violet-50 p-4">
                      <div className="grid grid-cols-[44px_minmax(0,1fr)] items-center gap-3">
                        <div className="grid h-11 w-11 place-items-center rounded-lg bg-yellow-400 text-lg font-black text-slate-950">
                          JS
                        </div>
                        <p className="min-w-0 text-sm font-semibold leading-5">
                          {activeModule?.title || "Module 2: JavaScript Basics"}
                        </p>
                      </div>
                      <Progress value={progress} color="bg-cyan-400" />
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <span className="font-medium">{progress}% Completed</span>
                        <button
                          onClick={() =>
                            activeModule && setPracticeId(activeModule.id)
                          }
                          className="rounded-lg bg-violet-600 px-4 py-2 font-semibold text-white"
                        >
                          Continue
                        </button>
                      </div>
                      <p className="mt-3 text-[10px] text-slate-500">
                        Estimated time: 2h 30m
                      </p>
                    </div>
                  </Panel>
                  <Panel className="min-h-[320px] min-w-0 overflow-hidden p-5">
                    <CardTitle title="Practice Tasks" />
                    <div className="mt-3 space-y-2">
                      {[
                        "DOM Manipulation Task",
                        "Build a To-Do App",
                        "JavaScript Quiz",
                      ].map((x, i) => (
                        <div
                          key={x}
                          className="grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
                        >
                          <ListChecks
                            size={17}
                            className={
                              i === 0 ? "text-amber-400" : "text-cyan-400"
                            }
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium leading-4">{x}</p>
                            <p className="text-[10px] text-slate-500">
                              {i ? `Due ${25 + i} May` : "Due Today"}
                            </p>
                          </div>
                          <span
                            className={`whitespace-nowrap rounded border px-2 py-1 text-[9px] ${i === 0 ? "border-amber-400 bg-amber-50 text-amber-600" : "border-slate-200 bg-white text-slate-500"}`}
                          >
                            {i === 0
                              ? "In Progress"
                              : i === 1
                                ? "Pending"
                                : "Not Started"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Panel>
                  <Panel className="min-h-[320px] min-w-0 overflow-hidden p-5">
                    <CardTitle title="Practice Feedback (Latest)" />
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-600">
                          <Bot size={20} />
                        </div>
                        <div className="min-w-0 text-sm leading-5">
                          <p>Great job on your recent submission! 🎉</p>
                          <p className="mt-3 text-xs text-slate-500">
                            Suggestions:
                          </p>
                          <ul className="mt-1 ml-4 list-disc space-y-1 text-xs text-slate-600">
                            <li>Use semantic HTML tags</li>
                            <li>Improve CSS responsiveness</li>
                            <li>Add form validation</li>
                          </ul>
                        </div>
                      </div>
                      {activeModule && (
                        <button
                          onClick={() => setPracticeId(activeModule.id)}
                          className="mt-3 w-full rounded-md bg-violet-600 py-2 text-[10px] font-semibold text-white"
                        >
                          Open practice feedback
                        </button>
                      )}
                    </div>
                  </Panel>
                </div>

              </section>

              <RightRail progress={progressDetails} />
            </div>

            {activeTab > 0 && <section className="mx-auto max-w-5xl space-y-4">
              <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                {journeySteps.map(([label], index) => { const step = index + 1; return <button key={label} disabled={step > currentStep} onClick={() => openStep(step)} className={`shrink-0 rounded-lg px-4 py-2 text-xs font-semibold ${activeTab === step ? "bg-gradient-to-r from-purple-700 to-pink-500 text-white" : step > currentStep ? "cursor-not-allowed text-slate-300" : "text-slate-600 hover:bg-fuchsia-50"}`}>{step}. {label}</button>; })}
              </div>

              <ActionPanel
                id="action-panel"
                viewStep={activeTab}
                journey={journey}
                selectedSkills={selectedSkills}
                setSelectedSkills={setSelectedSkills}
                customSkill={customSkill}
                setCustomSkill={setCustomSkill}
                level={level}
                setLevel={setLevel}
                hours={hours}
                setHours={setHours}
                goals={goals}
                setGoals={setGoals}
                busy={busy}
                act={act}
                questions={questions}
                answers={answers}
                setAnswers={setAnswers}
                testType={testType}
                startTest={startTest}
                learningPathComment={learningPathComment}
                setLearningPathComment={setLearningPathComment}
                activeModule={activeModule}
                progress={progress}
                setPracticeId={setPracticeId}
              />

              {activeTab === 2 && <Panel className="p-5"><h2 className="text-lg font-bold">Learning path for {currentSkill}</h2><p className="mt-1 text-sm text-slate-500">This roadmap is built from your selected skill, level, weekly availability, and learning goal.</p><div className="mt-5 grid gap-3 md:grid-cols-2">{journey.modules.map((module, index) => <div key={module.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold text-fuchsia-700">Module {index + 1}</p><h3 className="mt-1 font-semibold">{module.title}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{module.description}</p><p className="mt-3 text-xs font-medium">Milestone: {module.milestone}</p></div>)}</div></Panel>}

              {activeTab === 5 && journey.certified && <Panel id="certificate" className="border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 text-center"><Trophy className="mx-auto text-amber-500" size={44} /><p className="mt-3 text-xs font-bold uppercase tracking-[.25em] text-amber-700">Certificate of Achievement</p><h2 className="mt-3 text-2xl font-bold">{currentSkill} completed</h2><p className="mt-2 text-sm text-slate-500">You passed the mock test with {journey.mockTestScore}% and earned your SkillSwap certificate.</p><p className="mt-4 font-mono text-xs text-slate-500">Certificate ID: {journey.certificateId}</p><button onClick={() => window.print()} className="mt-5 rounded-lg bg-gradient-to-r from-purple-700 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white">Print certificate</button></Panel>}
              {activeTab === 5 && canStartAnotherSkill && <Panel className="p-5 text-center"><h2 className="text-lg font-bold">Ready for another skill?</h2><p className="mt-2 text-sm text-slate-500">Your {currentSkill} result is saved on the dashboard. You can now start a fresh learning path with the same account.</p><button disabled={busy} onClick={startAnotherSkill} className="mt-4 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Learn another skill</button></Panel>}
            </section>}
          </div>
        </div>
      </div>

      {practiceId && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#101a31] p-6 shadow-2xl">
            <h2 className="text-xl font-bold">Submit practice evidence</h2>
            <p className="mt-2 text-sm text-slate-400">
              Describe what you created, your approach, and one challenge you
              solved.
            </p>
            <textarea
              autoFocus
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              rows={6}
              className="mt-4 w-full rounded-xl border border-white/10 bg-[#071024] p-4 text-sm outline-none focus:border-violet-500"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setPracticeId(null)}
                className="rounded-lg px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                disabled={busy}
                onClick={() =>
                  act(
                    {
                      action: "completePractice",
                      moduleId: practiceId,
                      evidence,
                    },
                    () => setPracticeId(null),
                  )
                }
                className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold disabled:opacity-50"
              >
                Submit practice
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

type ActionProps = {
  id: string;
  viewStep?: number;
  journey: LearnerJourney;
  selectedSkills: string[];
  setSelectedSkills: React.Dispatch<React.SetStateAction<string[]>>;
  customSkill: string;
  setCustomSkill: (v: string) => void;
  level: LearnerJourney["level"];
  setLevel: (v: LearnerJourney["level"]) => void;
  hours: number;
  setHours: (v: number) => void;
  goals: string;
  setGoals: (v: string) => void;
  busy: boolean;
  act: (
    body: object,
    onDone?: (data: Record<string, unknown>) => void,
  ) => Promise<void>;
  questions: LearnerQuestion[];
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
  testType: "mock";
  startTest: (type: "mock") => Promise<void>;
  learningPathComment: string;
  setLearningPathComment: (v: string) => void;
  activeModule?: LearnerJourney["modules"][number];
  progress: number;
  setPracticeId: (v: string | null) => void;
};

function ActionPanel(p: ActionProps) {
  const viewStep = p.viewStep ?? p.journey.stage;
  const addCustomSkill = () => {
    const skill = p.customSkill.trim();
    if (
      !skill ||
      p.selectedSkills.some(
        (item) => item.toLowerCase() === skill.toLowerCase(),
      )
    )
      return;
    p.setSelectedSkills([skill]);
    p.setCustomSkill("");
  };

  if (viewStep === 1)
    return (
      <Panel id={p.id} className="p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-400">
          Step 1
        </p>
        <h2 className="mt-1 text-xl font-bold">
          Choose what you want to learn
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Select one skill below or write your own skill.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {LEARNER_SKILLS.map((skill) => (
            <button
              key={skill}
              onClick={() =>
                p.setSelectedSkills((items) =>
                  items.includes(skill)
                    ? []
                    : [skill],
                )
              }
              className={`rounded-lg border p-3 text-left text-xs ${p.selectedSkills.includes(skill) ? "border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700" : "border-slate-200 bg-white text-slate-700"}`}
            >
              {skill}
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-dashed border-fuchsia-300 bg-fuchsia-50/50 p-4">
          <label
            htmlFor="custom-skill"
            className="text-xs font-semibold text-fuchsia-800"
          >
            Write your own skill
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="custom-skill"
              value={p.customSkill}
              onChange={(e) => p.setCustomSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomSkill();
                }
              }}
              placeholder="e.g. Photography, Excel, Guitar"
              className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-fuchsia-500"
            />
            <button
              type="button"
              onClick={addCustomSkill}
              disabled={!p.customSkill.trim()}
              className="rounded-lg bg-fuchsia-600 px-4 text-sm font-semibold text-white disabled:opacity-40"
            >
              Add
            </button>
          </div>
          {p.selectedSkills.length > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              Selected: {p.selectedSkills.join(", ")}
            </p>
          )}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-slate-500">
            Current level
            <select
              value={p.level}
              onChange={(e) =>
                p.setLevel(e.target.value as LearnerJourney["level"])
              }
              className="mt-2 w-full rounded-lg border border-slate-200 p-3"
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </label>
          <label className="text-xs text-slate-500">
            Weekly availability: {p.hours} hours
            <input
              type="range"
              min="1"
              max="40"
              value={p.hours}
              onChange={(e) => p.setHours(Number(e.target.value))}
              className="mt-4 w-full accent-fuchsia-600"
            />
          </label>
        </div>
        <textarea
          value={p.goals}
          onChange={(e) => p.setGoals(e.target.value)}
          placeholder="What would you like to achieve?"
          rows={3}
          className="mt-4 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-fuchsia-500"
        />
        <button
          disabled={p.busy || p.selectedSkills.length !== 1}
          onClick={() =>
            p.act({
              action: "savePreferences",
              skills: p.selectedSkills,
              level: p.level,
              weeklyAvailability: p.hours,
              goals: p.goals,
            })
          }
          className="mt-4 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          Create learning path
        </button>
      </Panel>
    );

  if (viewStep === 2)
    return (
      <Panel id={p.id} className="p-5">
        <p className="text-xs uppercase tracking-widest text-violet-400">
          Skill-based learning path
        </p>
        <h2 className="mt-1 text-xl font-bold">
          Learn {p.journey.skills[0]} properly
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Complete each module in order. When you finish the full path, move to
          the completion comment step.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {p.journey.modules.map((module, index) => (
            <div
              key={module.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-xs font-semibold text-fuchsia-700">
                Module {index + 1}
              </p>
              <h3 className="mt-1 font-semibold">{module.title}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {module.description}
              </p>
              <p className="mt-3 text-xs font-medium">
                Milestone: {module.milestone}
              </p>
              <LearningList title="What to learn" items={module.topics} />
              <LearningList title="Where to learn" items={module.resources} />
              <LearningList
                title="Where to practise"
                items={module.practiceSources}
              />
              <LearningList title="Project ideas" items={module.projectIdeas} />
            </div>
          ))}
        </div>
        <button
          disabled={p.busy}
          onClick={() => p.act({ action: "completeLearningPath" })}
          className="mt-5 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          I completed the learning path
        </button>
      </Panel>
    );

  if (viewStep === 3)
    return (
      <Panel id={p.id} className="p-5">
        <p className="text-xs uppercase tracking-widest text-violet-400">
          Completion comment
        </p>
        <h2 className="mt-1 text-xl font-bold">
          Confirm your learning path progress
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Add a short comment such as what you completed, what you learned, or
          which part felt most useful.
        </p>
        <textarea
          value={p.learningPathComment}
          onChange={(e) => p.setLearningPathComment(e.target.value)}
          rows={4}
          placeholder="I completed all modules in the learning path and understood the main concepts..."
          className="mt-4 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-fuchsia-500"
        />
        <button
          disabled={p.busy || p.learningPathComment.trim().length < 15}
          onClick={() =>
            p.act({
              action: "submitLearningPathComment",
              learningPathComment: p.learningPathComment,
            })
          }
          className="mt-4 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          Continue to practice
        </button>
      </Panel>
    );

  if (viewStep === 5)
    return (
      <Panel id={p.id} className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-violet-400">
              Certification gate
            </p>
            <h2 className="mt-1 text-xl font-bold">Mock test</h2>
            <p className="mt-2 text-sm text-slate-500">
              Score 70% or higher to receive your certificate. If you score
              below 70%, no certificate is provided.
            </p>
            {typeof p.journey.mockTestScore === "number" && (
              <p className="mt-2 text-sm font-semibold text-slate-700">
                Latest score: {p.journey.mockTestScore}%
              </p>
            )}
          </div>
          {!p.questions.length && (
            <button
              disabled={p.busy}
              onClick={() => p.startTest("mock")}
              className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white"
            >
              Start mock test
            </button>
          )}
        </div>
        {p.journey.mockTestScore !== undefined && !p.journey.certified && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            You did not pass the 70% requirement. Review the practice tasks and
            take the mock test again when ready.
          </div>
        )}
        {p.questions.length > 0 && (
          <div className="mt-5 space-y-5">
            {p.questions.map((q, i) => (
              <div key={q.id}>
                <p className="text-sm font-semibold">
                  <span className="mr-2 text-violet-400">{i + 1}.</span>
                  {q.question}
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {q.options.map((option) => (
                    <button
                      key={option}
                      onClick={() =>
                        p.setAnswers((a) => {
                          const next = [...a];
                          next[i] = option;
                          return next;
                        })
                      }
                      className={`rounded-lg border p-3 text-left text-xs ${p.answers[i] === option ? "border-fuchsia-500 bg-fuchsia-50" : "border-slate-200"}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button
              disabled={
                p.busy ||
                p.answers.filter(Boolean).length !== p.questions.length
              }
              onClick={() =>
                p.act({
                  action: "submitTest",
                  testType: "mock",
                  answers: p.answers,
                })
              }
              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              Submit mock test
            </button>
          </div>
        )}
      </Panel>
    );

  if (viewStep === 4 && p.activeModule)
    return (
      <Panel id={p.id} className="p-5">
        <p className="text-xs uppercase tracking-widest text-violet-400">
          Practice session
        </p>
        <div className="mt-1 flex items-center justify-between">
          <h2 className="text-xl font-bold">{p.activeModule.title}</h2>
          <span className="rounded-full bg-fuchsia-50 px-3 py-1 text-xs text-fuchsia-700">
            {p.progress}% done
          </span>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          {p.activeModule.description}
        </p>
        <div className="mt-4 rounded-xl border border-fuchsia-100 bg-fuchsia-50/50 p-4 text-sm">
          {p.activeModule.practiceTask}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <LearningList
            title="Practice here"
            items={p.activeModule.practiceSources}
          />
          <LearningList
            title="Build one project"
            items={p.activeModule.projectIdeas}
          />
          <LearningList title="Use these resources" items={p.activeModule.resources} />
        </div>
        <button
          onClick={() => p.setPracticeId(p.activeModule!.id)}
          className="mt-4 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Submit practice
        </button>
      </Panel>
    );
  if (viewStep === 4)
    return <Panel id={p.id} className="p-6 text-center"><Check className="mx-auto text-emerald-500" size={38} /><h2 className="mt-3 text-xl font-bold">Practice completed</h2><p className="mt-2 text-sm text-slate-500">You have completed every practice module. Continue to the mock test.</p></Panel>;
  return null;
}

function Sidebar({
  currentStep,
  activeTab,
  mobileOpen,
  close,
  logout,
  busy,
  onSelect,
  onDashboard,
}: {
  currentStep: number;
  activeTab: number;
  mobileOpen: boolean;
  close: () => void;
  logout: () => void;
  busy: boolean;
  onSelect: (step: number) => void;
  onDashboard: () => void;
}) {
  return (
    <>
      <button
        aria-label="Close navigation"
        onClick={close}
        className={`fixed inset-0 z-50 bg-black/40 lg:hidden ${mobileOpen ? "block" : "hidden"}`}
      />
      <aside
        className={`learner-sidebar fixed inset-y-0 left-0 z-[60] flex w-[245px] shrink-0 flex-col border-r border-slate-200 bg-white p-3 text-slate-950 transition-transform lg:static lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-12 items-center gap-3 px-3">
          <GraduationCap className="text-purple-700" size={29} />
          <div>
            <p className="font-bold">SkillSwap</p>
            <p className="text-[9px] text-slate-500">Learn • Teach • Grow</p>
          </div>
        </div>
        <p className="mt-5 px-3 text-[9px] uppercase tracking-wider text-slate-400">
          Learner journey
        </p>
        <nav className="mt-2 space-y-1">
          <button type="button" onClick={onDashboard} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[12px] transition ${activeTab === 0 ? "bg-gradient-to-r from-purple-800 to-pink-500 text-white shadow-md shadow-fuchsia-100" : "text-slate-700 hover:bg-fuchsia-50 hover:text-fuchsia-700"}`}><Gauge size={16} />Dashboard</button>
          {navItems.map(([label, Icon], i) => {
            const step = i + 1;
            const active = step === activeTab;
            const locked = step > currentStep;
            return (
              <button
                key={label}
                type="button"
                disabled={locked}
                onClick={() => onSelect(step)}
                title={locked ? "Complete the previous step first" : label}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[12px] transition ${active ? "bg-gradient-to-r from-purple-800 to-pink-500 text-white shadow-md shadow-fuchsia-100" : locked ? "cursor-not-allowed text-slate-300" : "text-slate-700 hover:bg-fuchsia-50 hover:text-fuchsia-700"}`}
              >
                <Icon size={16} />
                {label}
                {locked && <LockKeyhole className="ml-auto" size={12} />}
              </button>
            );
          })}
        </nav>
        <button
          disabled={busy}
          onClick={logout}
          className="mt-auto flex items-center gap-3 border-t border-slate-100 px-3 pt-4 text-xs text-rose-500"
        >
          <LogOut size={16} /> Logout
        </button>
      </aside>
    </>
  );
}
function RightRail({ progress }: { progress: ProgressDetails }) {
  return (
    <aside>
      <Panel className="p-4">
        <h3 className="text-sm font-semibold">Overall Progress</h3>
        <div
          className="relative mx-auto mt-3 grid h-32 w-32 place-items-center rounded-full"
          style={{
            background: `conic-gradient(#c026d3 ${progress.overall * 3.6}deg,#f1f5f9 0)`,
          }}
        >
          <div className="grid h-[96px] w-[96px] place-items-center rounded-full bg-white text-center">
            <div>
              <p className="text-2xl font-bold">{progress.overall}%</p>
              <p className="text-[10px] text-slate-500">Completed</p>
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <RailProgress
            label="Skill Selected"
            value={progress.skillSelection}
            color="bg-violet-600"
          />
          <RailProgress
            label="Learning Path"
            value={progress.learningPath}
            color="bg-fuchsia-600"
          />
          <RailProgress
            label="Completion Comment"
            value={progress.completionComment}
            color="bg-cyan-500"
          />
          <RailProgress
            label="Practice"
            value={progress.practice}
            color="bg-emerald-500"
          />
          <RailProgress
            label="Mock Test"
            value={progress.mockTest}
            color="bg-orange-500"
          />
          <RailProgress
            label="Certificate"
            value={progress.certificate}
            color="bg-amber-500"
          />
        </div>
      </Panel>
    </aside>
  );
}
function Panel({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`learner-panel rounded-xl border border-slate-200 bg-white shadow-[0_5px_20px_rgba(15,23,42,.05)] ${className}`}
    >
      {children}
    </section>
  );
}
function Avatar({ user }: { user: User | null }) {
  const initial = (user?.displayName || user?.email || "L")
    .charAt(0)
    .toUpperCase();
  return (
    <span
      className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-gradient-to-br from-amber-200 to-violet-400 bg-cover bg-center font-bold text-slate-900"
      style={
        user?.photoURL
          ? { backgroundImage: `url(${user.photoURL})` }
          : undefined
      }
    >
      {user?.photoURL ? <span className="sr-only">Profile</span> : initial}
    </span>
  );
}
function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "violet" | "cyan" | "amber" | "rose";
}) {
  const colors = {
    violet: "text-purple-700",
    cyan: "text-emerald-600",
    amber: "text-amber-500",
    rose: "text-orange-500",
  };
  return (
    <div
      className={`flex min-h-[96px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,.05)] ${colors[tone]}`}
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-50">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] leading-4 text-slate-600">{label}</p>
        <p className="mt-1 whitespace-normal break-words text-base font-semibold leading-5 text-slate-950">
          {value}
        </p>
      </div>
    </div>
  );
}
function CardTitle({ title }: { title: string }) {
  return <h3 className="text-sm font-semibold">{title}</h3>;
}
function SkillResultCard({ result }: { result: LearnerSkillResult }) {
  const passed = result.status === "passed";
  const completedDate = new Date(result.completedAt).toLocaleDateString();
  return (
    <div
      className={`rounded-xl border p-4 ${
        passed
          ? "border-emerald-200 bg-emerald-50"
          : "border-rose-200 bg-rose-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">
            {result.skill}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {result.level} - Mock score {result.score}% - {completedDate}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
            passed
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          {passed ? "Completed" : "Failed"}
        </span>
      </div>
      {passed && result.certificateId && (
        <p className="mt-3 font-mono text-[11px] text-emerald-700">
          Certificate ID: {result.certificateId}
        </p>
      )}
      {!passed && (
        <p className="mt-3 text-xs text-rose-700">
          No certificate issued. The learner can start another skill or review
          this skill again later.
        </p>
      )}
    </div>
  );
}
function LearningList({ title, items = [] }: { title: string; items?: string[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-600">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <Check className="mt-0.5 shrink-0 text-emerald-500" size={13} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
function Progress({ value, color }: { value: number; color: string }) {
  return (
    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
function RailProgress({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-[10px] text-slate-300">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <Progress value={value} color={color} />
    </div>
  );
}
