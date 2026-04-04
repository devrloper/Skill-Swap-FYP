"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Step1 from "@/app/components/profile steps/step1";
import Step2 from "@/app/components/profile steps/step2";
import Step3 from "@/app/components/profile steps/step3";
import Step4 from "@/app/components/profile steps/step4";
import Image from "next/image";
import { db, auth } from "@/app/lib/firebase";
import { arrayUnion, doc, setDoc } from "firebase/firestore";

interface ProfileStepModalProps {
  readonly open: boolean;
  readonly setOpen: (value: boolean) => void;
  readonly mode?: "enroll" | "edit";
  readonly initialStep?: number;
}

export default function ProfileStepModal({
  open,
  setOpen,
  mode = "enroll",
  initialStep = 0,
}: ProfileStepModalProps) {
  const [step, setStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!open) return;
    setStep(initialStep);
    setCompletedSteps(mode === "edit" ? [0, 1, 2, 3, 4] : []);
  }, [open, initialStep, mode]);

  // Lock scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  if (!open) return null;

  const steps = [
    { step: "START", title: "Steps" },
    { step: "STEP 1", title: "Bio data" },
    { step: "STEP 2", title: "Education" },
    { step: "STEP 3", title: "Skills" },
    { step: "STEP 4", title: "AI Interview" },
  ];

  // Save step completion to Firestore
  const saveStepToDB = async (stepNumber: number) => {
    if (!userId) return;
    try {
      await setDoc(
        doc(db, "profiles", userId),
        { completedSteps: arrayUnion(stepNumber) },
        { merge: true }
      );
    } catch (err) {
      console.error("Error saving step:", err);
    }
  };

  // Called when moving to the next step
  const handleNextStep = (skills?: string[]) => {
    setCompletedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
    saveStepToDB(step); // Save to DB
    if (skills) setSelectedSkills(skills);
    setStep(step + 1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 px-3 sm:px-4 overflow-y-auto">
      <div className="min-h-screen flex items-start md:items-center justify-center py-3 md:py-8">
        <div className="w-full max-w-none md:max-w-4xl rounded-none md:rounded-2xl shadow-xl relative p-4 sm:p-5 md:p-10 max-h-[calc(100vh-1.5rem)] md:max-h-[90vh] overflow-y-auto bg-gradient-to-br from-indigo-50/80 via-purple-50/70 to-pink-50/80 border border-purple-100 backdrop-blur-xl">
          
          {/* Close button */}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-3 right-3 md:top-4 md:right-4 text-gray-400 hover:text-black bg-white/70 rounded-full p-1.5 shadow-sm"
            aria-label="Close modal"
          >
            <X />
          </button>

          {/* Header */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent pr-10 md:pr-0">
            Create Your Profile
          </h2>
          <p className="text-sm sm:text-base text-gray-500 text-center mt-2 mb-6 md:mb-8 max-w-xl mx-auto">
            Follow the steps to complete your profile
          </p>

          {/* MOBILE STEPPER */}
          <div className="md:hidden mb-6 text-center">
            <p className="text-sm text-gray-500 font-medium">
              Step {step} of {steps.length - 1}
            </p>
            <h3 className="text-lg font-semibold text-gray-800">
              {steps[step]?.title}
            </h3>
            <div className="w-full bg-gray-200 h-2 rounded-full mt-3">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all"
                style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* DESKTOP/TABLET STEPPER */}
           <div className="hidden md:flex justify-between items-start mb-12 relative gap-2">
             {steps.map((item, index) => {
               const current = index === step;
               const isDisabled =
                 mode !== "edit" &&
                 index > 0 &&
                 !completedSteps.includes(index - 1);

               return (
                 <div
                   key={item.step}
                  className="flex-1 min-w-[90px] flex flex-col items-center relative"
                >
                  <span className="text-sm font-semibold text-gray-500 mb-2">
                    {item.step}
                  </span>

                  <button
                    onClick={() => !isDisabled && setStep(index)}
                    disabled={isDisabled}
                    className={`w-full px-4 md:px-6 py-2 rounded-md font-semibold shadow transition md:min-h-[44px] flex items-center justify-center text-center
                      ${
                        current
                          ? "bg-gradient-to-r from-purple-700 to-pink-600 text-white"
                          : "bg-gray-200 text-gray-600"
                      } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {item.title}
                  </button>

                  {current && (
                    <span className="absolute -bottom-4 left-1/4 right-1/4 h-[3px] bg-gradient-to-r from-purple-600 to-pink-500 rounded-full"></span>
                  )}
                </div>
              );
            })}
          </div>

          {/* STEP CONTENT */}
          {step === 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 text-center">
              {[
                { img: "/bio1.png", text: "Profile Info" },
                { img: "/edu6.png", text: "Education" },
                { img: "/exp.png", text: "Experience" },
                { img: "/ai.png", text: "AI Interview" },
              ].map((item) => (
                <div key={item.text} className="min-w-0">
                  <div className="h-[96px] sm:h-[112px] md:h-[128px] flex items-center justify-center">
                    <Image
                      src={item.img}
                      alt={item.text}
                      width={190}
                      height={128}
                      className="mx-auto w-full max-w-[150px] sm:max-w-[170px] md:max-w-[190px] h-full object-contain"
                    />
                  </div>
                  <p className="mt-3 sm:mt-4 text-sm sm:text-base font-medium text-gray-700">
                    {item.text}
                  </p>
                </div>
              ))}

              <div className="col-span-full text-center mt-4 sm:mt-6">
                <button
                  onClick={() => handleNextStep()}
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 sm:px-8 py-3 rounded-lg font-semibold"
                >
                  Start →
                </button>
              </div>
            </div>
          )}

          {step === 1 && <Step1 onNext={handleNextStep} />}
          {step === 2 && <Step2 onNext={handleNextStep} />}
          {step === 3 && <Step3 onNext={handleNextStep} />}
          {step === 4 && <Step4 skills={selectedSkills} /> 
            
          }
        </div>
      </div>
    </div>
  );
}

