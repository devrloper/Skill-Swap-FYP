import { useState, useRef, useCallback } from "react";

export default function SkillsStep({ onNext }) {
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

  /* ===================== STATE ===================== */
  const [learnSkills, setLearnSkills] = useState([]);
  const [teachSkills, setTeachSkills] = useState([]);

  const [customLearnSkills, setCustomLearnSkills] = useState([]);
  const [customTeachSkills, setCustomTeachSkills] = useState([]);

  const [newLearnSkill, setNewLearnSkill] = useState("");
  const [newTeachSkill, setNewTeachSkill] = useState("");

  const [learnLevel, setLearnLevel] = useState("Beginner");
  const [teachLevel, setTeachLevel] = useState("Expert");

  const learnInputRef = useRef(null);
  const teachInputRef = useRef(null);

  /* ===================== COLOR MAP (TAILWIND SAFE) ===================== */
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

  /* ===================== LOGIC ===================== */
  const toggleSkill = useCallback((skill, type) => {
    if (type === "learn") {
      setLearnSkills((prev) =>
        prev.includes(skill)
          ? prev.filter((s) => s !== skill)
          : [...prev, skill]
      );
    } else {
      setTeachSkills((prev) =>
        prev.includes(skill)
          ? prev.filter((s) => s !== skill)
          : [...prev, skill]
      );
    }
  }, []);

  const addCustomSkill = useCallback(
    (skill, type, inputRef) => {
      if (!skill.trim()) return;

      if (type === "learn") {
        if (!customLearnSkills.includes(skill))
          setCustomLearnSkills([...customLearnSkills, skill]);
        if (!learnSkills.includes(skill))
          setLearnSkills([...learnSkills, skill]);
        setNewLearnSkill("");
      } else {
        if (!customTeachSkills.includes(skill))
          setCustomTeachSkills([...customTeachSkills, skill]);
        if (!teachSkills.includes(skill))
          setTeachSkills([...teachSkills, skill]);
        setNewTeachSkill("");
      }

      inputRef.current?.focus();
    },
    [customLearnSkills, customTeachSkills, learnSkills, teachSkills]
  );

  /* ===================== COMPONENTS ===================== */

  const ExpertiseLevel = ({ value, onChange }) => (
    <div className="flex flex-wrap gap-2 mt-2">
      {["Beginner", "Intermediate", "Expert"].map((level) => (
        <button
          key={level}
          type="button"
          onClick={() => onChange(level)}
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

  const SkillButton = ({ skill, selected, color, onClick }) => (
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

  const SkillInput = ({ value, setValue, type, inputRef, color }) => (
    <div className="mt-4 flex flex-col sm:flex-row gap-2 w-full">
      <input
        ref={inputRef}
        type="text"
        placeholder="Add custom skill (multiple words allowed)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addCustomSkill(value, type, inputRef);
          }
        }}
        className={`flex-1 border rounded-xl px-4 py-3 text-gray-700
          focus:outline-none focus:ring-2 ${colorMap[color].ring}`}
      />

      <button
        type="button"
        onClick={() => addCustomSkill(value, type, inputRef)}
        className={`px-6 py-3 rounded-xl text-white font-medium transition
          ${colorMap[color].button}`}
      >
        Add
      </button>
    </div>
  );

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
  }) => {
    const combinedSkills = [...skills, ...customSkills];

    return (
      <div className="bg-white rounded-3xl shadow-lg p-4 sm:p-6 space-y-5 border">
        <div>
          <h3 className="text-2xl font-semibold text-gray-900">{title}</h3>
          <p className="text-gray-500">{description}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-600">
            Expertise Level
          </p>
          <ExpertiseLevel
            value={type === "learn" ? learnLevel : teachLevel}
            onChange={type === "learn" ? setLearnLevel : setTeachLevel}
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
                className={`px-3 py-1 rounded-full text-sm font-medium
                  ${colorMap[color].light}`}
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
      <h2 className="text-4xl font-bold text-center text-gray-900">
        Skills
      </h2>

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
          onClick={onNext}
          className="px-12 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold shadow-lg hover:scale-105 transition"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
