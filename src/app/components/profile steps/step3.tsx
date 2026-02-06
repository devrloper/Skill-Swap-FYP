"use client";

import { useState, useRef, useCallback, useEffect, ChangeEvent } from "react";
import { db, auth } from "@/app/lib/firebase";
import { doc, setDoc, getDoc, DocumentData } from "firebase/firestore";

interface SkillsStepProps {
  onNext: (selectedSkills: string[]) => void; // <-- pass selected skills to next step
}

export default function SkillsStep({ onNext }: SkillsStepProps) {
  const defaultSkills = [
    "JavaScript",
    "Python",
    "React",
    "Node.js",
    "Web Development",
    "Android Development",
    "Tailwind CSS",
    "Figma",
    "Django",
    "AI & ML",
    "UI/UX Design",
    "Photoshop",
    "Data Analysis",
    "SQL",
    "NoSQL",
  ];

  const userId = auth.currentUser?.uid;

  /* ===================== STATE ===================== */
  const [learnSkills, setLearnSkills] = useState<string[]>([]);
  const [teachSkills, setTeachSkills] = useState<string[]>([]);
  const [customLearnSkills, setCustomLearnSkills] = useState<string[]>([]);
  const [customTeachSkills, setCustomTeachSkills] = useState<string[]>([]);
  const [newLearnSkill, setNewLearnSkill] = useState("");
  const [newTeachSkill, setNewTeachSkill] = useState("");
  const [learnLevel, setLearnLevel] = useState("Beginner");
  const [teachLevel, setTeachLevel] = useState("Expert");

  const learnInputRef = useRef<HTMLInputElement>(null);
  const teachInputRef = useRef<HTMLInputElement>(null);

  /* ===================== COLOR MAP ===================== */
  const colorMap = {
    purple: {
      button: "bg-purple-600 hover:bg-purple-700",
      light: "bg-purple-100 text-purple-800",
      ring: "focus:ring-purple-300",
    },
    pink: {
      button: "bg-pink-600 hover:bg-pink-700",
      light: "bg-pink-100 text-pink-800",
      ring: "focus:ring-pink-300",
    },
  };

  /* ===================== FIRESTORE LOAD ===================== */
  useEffect(() => {
    if (!userId) return;

    const loadSkills = async () => {
      try {
        const docRef = doc(db, "profiles", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as DocumentData;
          if (data.skills) {
            setLearnSkills(data.skills.learnSkills || []);
            setTeachSkills(data.skills.teachSkills || []);
            setCustomLearnSkills(data.skills.customLearnSkills || []);
            setCustomTeachSkills(data.skills.customTeachSkills || []);
            setLearnLevel(data.skills.learnLevel || "Beginner");
            setTeachLevel(data.skills.teachLevel || "Expert");
          }
        }
      } catch (err) {
        console.error("Error loading skills:", err);
      }
    };

    loadSkills();
  }, [userId]);

  /* ===================== FIRESTORE SAVE ===================== */
  const saveSkills = async (updated: Partial<{
    learnSkills: string[];
    teachSkills: string[];
    customLearnSkills: string[];
    customTeachSkills: string[];
    learnLevel: string;
    teachLevel: string;
  }> = {}) => {
    if (!userId) return;
    try {
      await setDoc(
        doc(db, "profiles", userId),
        {
          skills: {
            learnSkills,
            teachSkills,
            customLearnSkills,
            customTeachSkills,
            learnLevel,
            teachLevel,
            ...updated,
          },
        },
        { merge: true }
      );
    } catch (err) {
      console.error("Error saving skills:", err);
    }
  };

  /* ===================== LOGIC ===================== */
  const toggleSkill = useCallback(
    (skill: string, type: "learn" | "teach") => {
      if (type === "learn") {
        const updated = learnSkills.includes(skill)
          ? learnSkills.filter((s) => s !== skill)
          : [...learnSkills, skill];
        setLearnSkills(updated);
        saveSkills({ learnSkills: updated });
      } else {
        const updated = teachSkills.includes(skill)
          ? teachSkills.filter((s) => s !== skill)
          : [...teachSkills, skill];
        setTeachSkills(updated);
        saveSkills({ teachSkills: updated });
      }
    },
    [learnSkills, teachSkills]
  );

  const addCustomSkill = useCallback(
    (skill: string, type: "learn" | "teach", inputRef: React.RefObject<HTMLInputElement>) => {
      if (!skill.trim()) return;

      if (type === "learn") {
        if (!customLearnSkills.includes(skill))
          setCustomLearnSkills((prev) => {
            const updated = [...prev, skill];
            saveSkills({ customLearnSkills: updated });
            return updated;
          });
        if (!learnSkills.includes(skill)) toggleSkill(skill, "learn");
        setNewLearnSkill("");
      } else {
        if (!customTeachSkills.includes(skill))
          setCustomTeachSkills((prev) => {
            const updated = [...prev, skill];
            saveSkills({ customTeachSkills: updated });
            return updated;
          });
        if (!teachSkills.includes(skill)) toggleSkill(skill, "teach");
        setNewTeachSkill("");
      }

      inputRef.current?.focus();
    },
    [customLearnSkills, customTeachSkills, learnSkills, teachSkills, toggleSkill]
  );

  /* ===================== COMPONENTS ===================== */
  interface ExpertiseLevelProps {
    value: string;
    onChange: (val: string) => void;
    type: "learn" | "teach";
  }

  const ExpertiseLevel = ({ value, onChange, type }: ExpertiseLevelProps) => (
    <div className="flex flex-wrap gap-2 mt-2">
      {["Beginner", "Intermediate", "Expert"].map((level) => (
        <button
          key={level}
          type="button"
          onClick={() => {
            onChange(level);
            saveSkills(type === "learn" ? { learnLevel: level } : { teachLevel: level });
          }}
          className={`px-4 py-2 rounded-full text-sm font-medium border transition
            ${
              value === level
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
        >
          {level}
        </button>
      ))}
    </div>
  );

  interface SkillButtonProps {
    skill: string;
    selected: boolean;
    color: "purple" | "pink";
    onClick: () => void;
  }

  const SkillButton = ({ skill, selected, color, onClick }: SkillButtonProps) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-2xl border text-sm font-medium transition
        ${
          selected
            ? `${colorMap[color].button} text-white border-transparent`
            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
        }`}
    >
      {skill}
    </button>
  );

  interface SkillInputProps {
    value: string;
    setValue: (val: string) => void;
    type: "learn" | "teach";
    inputRef: React.RefObject<HTMLInputElement>;
    color: "purple" | "pink";
  }

  const SkillInput = ({ value, setValue, type, inputRef, color }: SkillInputProps) => (
    <div className="mt-4 flex flex-col sm:flex-row gap-2 w-full">
      <input
        ref={inputRef}
        type="text"
        placeholder="Add custom skill (multiple words allowed)"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addCustomSkill(value, type, inputRef);
          }
        }}
        className={`flex-1 border rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 ${colorMap[color].ring}`}
      />

      <button
        type="button"
        onClick={() => addCustomSkill(value, type, inputRef)}
        className={`px-6 py-3 rounded-xl text-white font-medium transition ${colorMap[color].button}`}
      >
        Add
      </button>
    </div>
  );

  interface SkillCardProps {
    title: string;
    description: string;
    skills: string[];
    selectedSkills: string[];
    color: "purple" | "pink";
    type: "learn" | "teach";
    inputRef: React.RefObject<HTMLInputElement>;
    newSkill: string;
    setNewSkill: (val: string) => void;
    customSkills: string[];
  }

  const SkillCard = ({
    title,
    description,
    skills,
    selectedSkills,
    color,
    type,
    inputRef,
    newSkill,
    setNewSkill,
    customSkills,
  }: SkillCardProps) => {
    const combinedSkills = [...skills, ...customSkills];

    return (
      <div className="bg-white rounded-3xl shadow-lg p-4 sm:p-6 space-y-5 border">
        <div>
          <h3 className="text-2xl font-semibold text-gray-900">{title}</h3>
          <p className="text-gray-500">{description}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-600">Expertise Level</p>
          <ExpertiseLevel
            value={type === "learn" ? learnLevel : teachLevel}
            onChange={type === "learn" ? setLearnLevel : setTeachLevel}
            type={type}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {combinedSkills.map((skill) => (
            <SkillButton
              key={skill}
              skill={skill}
              selected={selectedSkills.includes(skill)}
              color={color}
              onClick={() => toggleSkill(skill, type)}
            />
          ))}
        </div>

        <SkillInput
          value={newSkill}
          setValue={setNewSkill}
          type={type}
          inputRef={inputRef}
          color={color}
        />

        {selectedSkills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedSkills.map((skill) => (
              <span
                key={skill}
                className={`px-3 py-1 rounded-full text-sm font-medium ${colorMap[color].light}`}
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  /* ===================== UI ===================== */
  return (
    <div className="max-w-6xl mx-auto px-4 space-y-10">
      <h2 className="text-4xl font-bold text-center text-gray-900">Skills</h2>

      <div className="flex flex-col gap-8">
        <SkillCard
          title="Skills You Want to Learn"
          description="Choose skills you want to learn or improve."
          skills={defaultSkills}
          selectedSkills={learnSkills}
          color="purple"
          type="learn"
          inputRef={learnInputRef}
          newSkill={newLearnSkill}
          setNewSkill={setNewLearnSkill}
          customSkills={customLearnSkills}
        />

        <SkillCard
          title="Skills You Want to Teach"
          description="Choose skills you can teach others."
          skills={defaultSkills}
          selectedSkills={teachSkills}
          color="pink"
          type="teach"
          inputRef={teachInputRef}
          newSkill={newTeachSkill}
          setNewSkill={setNewTeachSkill}
          customSkills={customTeachSkills}
        />
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => onNext(Array.from(new Set([...learnSkills, ...teachSkills])))} // <-- selected skills pass here
          className="px-12 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold shadow-lg hover:scale-105 transition"
          disabled={learnSkills.length === 0}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
