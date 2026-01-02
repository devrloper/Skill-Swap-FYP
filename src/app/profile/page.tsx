"use client";

import { useState } from "react";

type Education = { degree: string; institution: string; year: string };
type Skill = { name: string; level: string };

const ProfilePage = () => {
  const [step, setStep] = useState(1);
  const [aiPassed, setAiPassed] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "Tanmoy Karmaker",
    email: "tanmoy@example.com",
    phone: "",
    bio: "",
    avatar: null as File | null,
    address: "120 Upper Bozer, Notore Sadar, Notore",
    city: "Notore",
    state: "Rajshahi",
    zip: "6400",
    country: "Bangladesh",
    education: [] as Education[],
    cv: null as File | null,
    skills: [] as Skill[],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: "avatar" | "cv") => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, [field]: e.target.files[0] });
    }
  };

  // Education
  const addEducation = () => {
    setFormData({
      ...formData,
      education: [...formData.education, { degree: "", institution: "", year: "" }],
    });
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const updated = [...formData.education];
    updated[index][field] = value;
    setFormData({ ...formData, education: updated });
  };

  // Skills
  const addSkill = () => {
    setFormData({ ...formData, skills: [...formData.skills, { name: "", level: "Beginner" }] });
  };

  const updateSkill = (index: number, field: keyof Skill, value: string) => {
    const updated = [...formData.skills];
    updated[index][field] = value;
    setFormData({ ...formData, skills: updated });
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  // Mock AI interview
  const handleAiInterview = () => {
    const passed = Math.random() > 0.3; // 70% chance pass
    setAiPassed(passed);
    alert(passed ? "AI Interview Passed!" : "AI Interview Failed. Try Again.");
  };

  const handleSaveProfile = () => {
    if (!aiPassed) return alert("You must pass the AI interview first!");
    // Save profile to backend or localStorage
    localStorage.setItem("profile", JSON.stringify(formData));
    alert("Profile saved successfully!");
    setStep(5); // show success
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-purple-600 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold">Weblance</div>
        <nav className="flex-1 space-y-2 p-4">
          <button className="w-full text-left px-4 py-2 rounded hover:bg-purple-700">My Job Feed</button>
          <button className="w-full text-left px-4 py-2 rounded bg-purple-700">Profile</button>
          <button className="w-full text-left px-4 py-2 rounded hover:bg-purple-700">Dashboard</button>
          <button className="w-full text-left px-4 py-2 rounded hover:bg-purple-700">Saved Jobs</button>
          <button className="w-full text-left px-4 py-2 rounded hover:bg-purple-700">Settings</button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-8 space-y-6">
          {/* Step Indicator */}
          {step <= 4 && (
            <div className="flex justify-between mb-6 items-center">
              <div className="text-purple-600 font-semibold">Step {step} of 4</div>
              <div className="flex-1 bg-gray-200 h-2 rounded-full mx-4">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${(step / 4) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Step 1: Bio */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-purple-600">Personal Bio</h2>
              <div className="flex items-center space-x-4">
                <img
                  src={formData.avatar ? URL.createObjectURL(formData.avatar) : "/avatar.jpg"}
                  alt="Profile"
                  className="w-20 h-20 rounded-full border-2 border-purple-600"
                />
                <input type="file" onChange={(e) => handleFileChange(e, "avatar")} />
              </div>
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <input
                type="text"
                name="phone"
                placeholder="Phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <textarea
                name="bio"
                placeholder="Short Bio"
                value={formData.bio}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <div className="flex justify-end">
                <button
                  onClick={nextStep}
                  className="bg-pink-500 text-white px-6 py-2 rounded hover:bg-pink-600"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Education */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-purple-600">Education & CV</h2>
              {formData.education.map((edu, idx) => (
                <div key={idx} className="border p-4 rounded space-y-2">
                  <input
                    type="text"
                    placeholder="Degree"
                    value={edu.degree}
                    onChange={(e) => updateEducation(idx, "degree", e.target.value)}
                    className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                  <input
                    type="text"
                    placeholder="Institution"
                    value={edu.institution}
                    onChange={(e) => updateEducation(idx, "institution", e.target.value)}
                    className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                  <input
                    type="text"
                    placeholder="Year"
                    value={edu.year}
                    onChange={(e) => updateEducation(idx, "year", e.target.value)}
                    className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              ))}
              <button
                onClick={addEducation}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                Add Education
              </button>
              <div>
                <label>Upload CV/Document:</label>
                <input type="file" onChange={(e) => handleFileChange(e, "cv")} />
              </div>
              <div className="flex justify-between mt-4">
                <button onClick={prevStep} className="bg-gray-300 px-6 py-2 rounded">Back</button>
                <button onClick={nextStep} className="bg-pink-500 text-white px-6 py-2 rounded hover:bg-pink-600">Next</button>
              </div>
            </div>
          )}

          {/* Step 3: Skills */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-purple-600">Skills</h2>
              {formData.skills.map((skill, idx) => (
                <div key={idx} className="flex space-x-2 items-center">
                  <input
                    type="text"
                    placeholder="Skill"
                    value={skill.name}
                    onChange={(e) => updateSkill(idx, "name", e.target.value)}
                    className="flex-1 border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                  <select
                    value={skill.level}
                    onChange={(e) => updateSkill(idx, "level", e.target.value)}
                    className="border px-2 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Expert</option>
                  </select>
                </div>
              ))}
              <button
                onClick={addSkill}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                Add Skill
              </button>
              <div className="flex justify-between mt-4">
                <button onClick={prevStep} className="bg-gray-300 px-6 py-2 rounded">Back</button>
                <button onClick={nextStep} className="bg-pink-500 text-white px-6 py-2 rounded hover:bg-pink-600">Next</button>
              </div>
            </div>
          )}

          {/* Step 4: AI Interview */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-purple-600">AI Interview</h2>
              <p>Pass this interview to save your profile.</p>
              <button
                onClick={handleAiInterview}
                className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
              >
                Start AI Interview
              </button>
              <div className="flex justify-between mt-4">
                <button onClick={prevStep} className="bg-gray-300 px-6 py-2 rounded">Back</button>
                <button onClick={handleSaveProfile} className="bg-pink-500 text-white px-6 py-2 rounded hover:bg-pink-600">
                  Save Profile
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 5 && (
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-purple-600">Profile Saved!</h2>
              <p>Your professional profile has been successfully created.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
