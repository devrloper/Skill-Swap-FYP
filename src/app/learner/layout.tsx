import { redirect } from "next/navigation";
import { adminDb } from "@/app/lib/firebaseAdmin";
import { requireSessionUser } from "@/app/lib/serverAuth";

export default async function LearnerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireSessionUser();
  const userSnapshot = await adminDb.collection("users").doc(user.uid).get();

  if (userSnapshot.data()?.role !== "learner") {
    redirect("/dashboard");
  }

  return children;
}
