import Image from "next/image";
import { notFound } from "next/navigation";
import { adminDb } from "@/app/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

type ProfilePageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;

  const snap = await adminDb.collection("profiles").doc(id).get();
  if (!snap.exists) notFound();

  const profile = snap.data() || {};
  const name = (profile.fullName || profile.name || "Profile") as string;
  const location = (profile.location || "") as string;
  const photoURL = (profile.photoURL || "") as string;

  const skills = profile.skills || {};
  const learnSkills: string[] = [
    ...((skills.learnSkills as string[]) || []),
    ...((skills.customLearnSkills as string[]) || []),
  ];
  const teachSkills: string[] = [
    ...((skills.teachSkills as string[]) || []),
    ...((skills.customTeachSkills as string[]) || []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fbc2eb] to-purple-600 px-4 py-10">
      <div className="max-w-3xl mx-auto bg-white/70 backdrop-blur-xl rounded-[32px] shadow-2xl border border-white/40 overflow-hidden">
        <div className="p-8">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-white border border-white/60 shadow-sm flex items-center justify-center">
              {photoURL ? (
                <Image
                  src={photoURL}
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
              {location && (
                <p className="text-sm text-slate-600 mt-1">{location}</p>
              )}
              <p className="text-xs text-slate-500 mt-2 break-all">
                User ID: {id}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-white/70 border border-white/60 rounded-2xl p-5">
              <h2 className="font-bold text-slate-800 mb-3">Offering</h2>
              {teachSkills.length ? (
                <div className="flex flex-wrap gap-2">
                  {teachSkills.map((s) => (
                    <span
                      key={s}
                      className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-lg"
                    >
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
                    <span
                      key={s}
                      className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-lg"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600">Not set</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

