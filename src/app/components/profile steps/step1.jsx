import { useState } from "react";

export default function ProfileInfoStep({ onNext }) {
  const [preview, setPreview] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) setPreview(URL.createObjectURL(file));
  };

  return (
    <div className="space-y-10">
      {/* Title */}
      <h3 className="text-2xl font-semibold text-gray-900">
        Profile Setup
      </h3>

      {/* Card */}
      <div className="rounded-2xl p-6 bg-gradient-to-br from-purple-50/80 via-indigo-50/60 to-pink-50/70 border border-purple-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Profile Image */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-purple-300/30 to-pink-300/30 flex items-center justify-center overflow-hidden ring-2 ring-purple-200">
              {preview ? (
                <img
                  src={preview}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-600 text-sm">
                  Upload Photo
                </span>
              )}
            </div>

            <label className="text-sm text-purple-700 cursor-pointer font-medium hover:underline">
              Choose Image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
          </div>

          {/* Info */}
          <div className="md:col-span-2 space-y-5">
            <h4 className="text-xs font-semibold tracking-widest text-gray-600 uppercase">
              Personal Information
            </h4>

            <SoftInput placeholder="Full Name" />
            <SoftInput placeholder="Email Address" type="email" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SoftInput placeholder="Location (City, Country)" />
              <SoftInput placeholder="Phone Number" />
            </div>
          </div>
        </div>

        {/* About */}
        <div className="mt-8 space-y-3">
          <h4 className="text-xs font-semibold tracking-widest text-gray-600 uppercase">
            About Yourself
          </h4>

          <textarea
            rows={4}
            placeholder="Write a short professional bio, skills, or interests"
            className="w-full rounded-xl px-4 py-3 bg-indigo-50/60 border border-indigo-100 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400/40 transition"
          />
        </div>
      </div>

      {/* Button */}
      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold shadow-md hover:scale-[1.03] transition"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

/* Soft Colored Input */
function SoftInput({ placeholder, type = "text" }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className="w-full rounded-xl px-4 py-3 bg-indigo-50/60 border border-indigo-100 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400/40 transition"
    />
  );
}
