"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { db, auth, storage } from "@/app/lib/firebase";
import { updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc, DocumentData } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes, type StorageReference } from "firebase/storage";

interface ProfileInfoStepProps {
  onNext: () => void;
  onSaved?: () => void;
}

export default function ProfileInfoStep({ onNext, onSaved }: ProfileInfoStepProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  const lastUploadedPhotoURLRef = useRef<string | null>(null);
  const userId = auth.currentUser?.uid;

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read image"));
      reader.readAsDataURL(file);
    });

  const uploadWithTimeout = async (imageRef: StorageReference, file: File) => {
    const timeoutMs = 12000;
    const timeoutPromise = new Promise<never>((_, reject) =>
      window.setTimeout(() => reject(new Error("Upload timed out")), timeoutMs),
    );

    await Promise.race([uploadBytes(imageRef, file), timeoutPromise]);
    return getDownloadURL(imageRef);
  };

  // Load existing profile data
  useEffect(() => {
    if (!userId) return;

    const loadProfile = async () => {
      try {
        const docRef = doc(db, "profiles", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as DocumentData;
          setFullName(data.fullName || "");
          setEmail(data.email || "");
          setGender(data.gender || "");
          setLocation(data.location || "");
          setPhone(data.phone || "");
          setBio(data.bio || "");
          setPreview(data.photoURL || null);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      }
    };

    loadProfile();
  }, [userId]);

  // Handle image selection
  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    lastUploadedPhotoURLRef.current = null;

    try {
      const localDataUrl = await fileToDataUrl(file);
      setPreview(localDataUrl);
      setUploadingImage(false);

      if (!userId) {
        return;
      }

      const fileExt = file.name.split(".").pop() || "jpg";
      const imageRef = ref(
        storage,
        `profile-images/${userId}/avatar-${Date.now()}.${fileExt}`,
      );

      void (async () => {
        try {
          const downloadURL = await uploadWithTimeout(imageRef, file);
          lastUploadedPhotoURLRef.current = downloadURL;
          setPreview(downloadURL);
        } catch (uploadErr) {
          console.warn("Storage upload failed, keeping data URL preview:", uploadErr);
        }
      })();
    } catch (err) {
      console.error("Error preparing image:", err);
      setUploadingImage(false);
      setPreview(null);
      alert("Image upload failed. Please try again.");
    }
  };

  // Save data to Firestore and go to next step
  const handleNext = async () => {
    if (!userId) return;

    setSaving(true);

    try {
      const savedPhotoURL = lastUploadedPhotoURLRef.current || preview;
      await setDoc(
        doc(db, "profiles", userId),
        {
          fullName,
          email,
          gender,
          location,
          phone,
          bio,
          photoURL: savedPhotoURL,
          photoUpdatedAt: Date.now(),
        },
        { merge: true },
      );

      if (
        auth.currentUser &&
        savedPhotoURL &&
        !savedPhotoURL.startsWith("data:") &&
        !savedPhotoURL.startsWith("blob:")
      ) {
        await updateProfile(auth.currentUser, {
          displayName: fullName || auth.currentUser.displayName,
          photoURL: savedPhotoURL,
        });
      }

      onSaved?.();
      onNext();
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Validation: check if all required fields are filled
  const isFormValid =
    !!fullName && !!email && !!gender && !!location && !!phone && !!bio && !!preview;

  return (
    <div className="space-y-10">
      <h3 className="text-2xl font-semibold text-gray-900">Profile Setup</h3>

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
                <span className="text-gray-600 text-sm">Upload Photo</span>
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

            <SoftInput
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <SoftInput
              placeholder="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SoftSelect
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              />
              <SoftInput
                placeholder="Location (City, Country)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <SoftInput
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
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
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full rounded-xl px-4 py-3 bg-indigo-50/60 border border-indigo-100 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400/40 transition"
          />
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-end">
        <button
          onClick={handleNext}
          disabled={saving || uploadingImage || !isFormValid}
          className={`px-8 py-3 rounded-xl text-white font-semibold shadow-md transition ${
            saving || uploadingImage || !isFormValid
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-600 to-pink-500 hover:scale-[1.03]"
          }`}
        >
          {uploadingImage ? "Uploading..." : saving ? "Saving..." : "Continue ->"}
        </button>
      </div>
    </div>
  );
}

/* Soft Colored Input */
interface SoftInputProps {
  placeholder: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function SoftInput({ placeholder, type = "text", value, onChange }: SoftInputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full rounded-xl px-4 py-3 bg-indigo-50/60 border border-indigo-100 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400/40 transition"
    />
  );
}

interface SoftSelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

function SoftSelect({ value, onChange }: SoftSelectProps) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full rounded-xl px-4 py-3 bg-indigo-50/60 border border-indigo-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400/40 transition"
    >
      <option value="" disabled>
        Select Gender
      </option>
      <option value="Male">Male</option>
      <option value="Female">Female</option>
    </select>
  );
}
