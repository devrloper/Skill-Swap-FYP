import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminDb } from "@/app/lib/firebaseAdmin";
import { getSessionUser } from "@/app/lib/serverAuth";
import SkillRequestPanel from "@/app/components/skill-request-panel/page";

export const dynamic = "force-dynamic";

type ProfilePageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;
  const session = await getSessionUser();

  const snap = await adminDb.collection("profiles").doc(id).get();
  if (!snap.exists) notFound();

  const profile = snap.data() || {};
  const name = (profile.fullName || profile.name || "Profile") as string;
  const location = (profile.location || "") as string;
  const gender = (profile.gender || "") as string;
  const photoURL =
    typeof profile.photoURL === "string" && !profile.photoURL.startsWith("blob:")
      ? profile.photoURL
      : "";
  const photoSrc = photoURL
    ? photoURL.startsWith("data:")
      ? photoURL
      : `${photoURL}${profile.photoUpdatedAt ? `?v=${profile.photoUpdatedAt}` : ""}`
    : "";

  const skills = profile.skills || {};
  const learnSkills: string[] = [
    ...((skills.learnSkills as string[]) || []),
    ...((skills.customLearnSkills as string[]) || []),
  ];
  const teachSkills: string[] = [
    ...((skills.teachSkills as string[]) || []),
    ...((skills.customTeachSkills as string[]) || []),
  ];

  const isOwnProfile = session?.uid === id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fbc2eb] to-purple-600 px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white/70 backdrop-blur-xl rounded-[32px] shadow-2xl border border-white/40 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-white border border-white/60 shadow-sm flex items-center justify-center">
                {photoSrc ? (
                  <Image
                    src={photoSrc}
                    alt={name}
                    width={80}
                    height={80}
                    className="w-20 h-20 object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 flex items-center justify-center text-2xl font-black text-purple-700">
                    {name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-black text-slate-800">
                  {name}
                </h1>
                {location && <p className="text-sm text-slate-600 mt-1">{location}</p>}
                {gender && <p className="text-sm text-slate-600 mt-1 inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">{gender}</p>}
                <p className="text-xs text-slate-500 mt-2 break-all">User ID: {id}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="bg-white/70 border border-white/60 rounded-2xl p-5">
                <h2 className="font-bold text-slate-800 mb-3">Offering</h2>
                {teachSkills.length ? (
                  <div className="flex flex-wrap gap-2">
                    {teachSkills.map((s) => (
                      <span key={s} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-lg">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">Not set</p>
                )}
              </div>

              <div className="bg-white/70 border border-white/60 rounded-2xl p-5">
                <h2 className="font-bold text-slate-800 mb-3">Seeking</h2>
                {learnSkills.length ? (
                  <div className="flex flex-wrap gap-2">
                    {learnSkills.map((s) => (
                      <span key={s} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-lg">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">Not set</p>
                )}
              </div>
            </div>

            <div className="bg-white/70 border border-white/60 rounded-2xl p-5 mt-6">
              <h2 className="font-bold text-slate-800 mb-3">Profile Details</h2>
              <p className="text-sm text-slate-700">
                {(profile.bio as string) || "No bio has been added yet."}
              </p>
            </div>
          </div>
        </div>

        {!isOwnProfile ? (
          <SkillRequestPanel
            receiverId={id}
            receiverName={name}
            receiverTeachSkills={teachSkills}
            receiverLearnSkills={learnSkills}
          />
        ) : (
          <div className="bg-white/70 backdrop-blur-xl rounded-[32px] shadow-2xl border border-white/40 overflow-hidden p-8">
            <h2 className="font-black text-slate-800 text-xl">This is your profile</h2>
            <p className="text-sm text-slate-600 mt-2">
              Open another user profile to send a skill swap request.
            </p>
            <Link
              href="/matching"
              className="inline-flex mt-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:brightness-105 transition"
            >
              Browse users
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
