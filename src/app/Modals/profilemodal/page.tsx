import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Step1 from "@/app/components/profile steps/step1";
import Step2 from "@/app/components/profile steps/step2";
import Step3 from  "@/app/components/profile steps/step3";
export default function ProfileStepModal({ open, setOpen }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [open]);

  if (!open) return null;

  const steps = [
    { step: "START", title: "Steps" },
    { step: "STEP 1", title: "Bio data" },
    { step: "STEP 2", title: "Education" },
    { step: "STEP 3", title: "Skills" },
    { step: "STEP 4", title: "Interv AI" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 px-4 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="w-full max-w-4xl rounded-2xl shadow-xl relative p-6 md:p-10 max-h-[90vh] overflow-y-auto
bg-gradient-to-br from-indigo-50/80 via-purple-50/70 to-pink-50/80
border border-purple-100 backdrop-blur-xl"
        >
          {/* Close */}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-black"
          >
            <X />
          </button>

          {/* Header */}
          <h2 className="text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            Create Your Profile
          </h2>
          <p className="text-gray-500 text-center mt-2 mb-8">
            Follow the steps to complete your profile
          </p>

          {/* ================= MOBILE STEPPER ================= */}
          <div className="md:hidden mb-8 text-center">
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

          {/* ================= DESKTOP/TABLET STEPPER ================= */}
          <div className="hidden md:flex justify-between items-start mb-12 relative gap-2">
            {steps.map((item, index) => {
              const current = index === step;
              return (
                <div
                  key={index}
                  className="flex-1 min-w-[90px] flex flex-col items-center relative"
                >
                  <span className="text-sm font-semibold text-gray-500 mb-2">
                    {item.step}
                  </span>

                  <button
                    onClick={() => setStep(index)}
                    className={`w-full px-4 md:px-6 py-2 rounded-md font-semibold shadow transition
                      ${
                        current
                          ? "bg-gradient-to-r from-purple-700 to-pink-600 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
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

          {/* ================= STEP CONTENT ================= */}

          {/* STEP 0 – OVERVIEW */}
          {step === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { img: "/bio1.png", text: "Profile Info" },
                { img: "/edu6.png", text: "Education" },
                { img: "/exp.png", text: "Experience" },
                { img: "/ai.png", text: "AI Interview" },
              ].map((item, i) => (
                <div key={i}>
                  <img
                    src={item.img}
                    alt={item.text}
                    className="mx-auto w-36 h-32"
                  />
                  <p className="mt-4 font-medium text-gray-700">{item.text}</p>
                </div>
              ))}

              <div className="col-span-full text-center mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-8 py-3 rounded-lg font-semibold"
                >
                  Start →
                </button>
              </div>
            </div>
          )}

          {step === 1 && <Step1 onNext={() => setStep(2)} />}

          {/* STEP 2 – EDUCATION */}
          {step === 2 && <Step2 onNext={() => setStep(3)} />}

          {/* STEP 3 – Skills */}
          {step === 3 && <Step3 onNext={() => setStep(4)} /> }

          {/* STEP 4 – AI INTERVIEW */}
          {step === 4 && (
            <div className="text-center space-y-6">
              <h3 className="text-2xl font-bold">AI Interview</h3>
              <p className="text-gray-600">
                Answer a few AI-powered questions to complete your profile.
              </p>
              <button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-8 py-3 rounded-lg font-semibold">
                Start Interview
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
