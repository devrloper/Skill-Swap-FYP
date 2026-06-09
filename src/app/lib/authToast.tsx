"use client";

import toast from "react-hot-toast";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

type AuthToastType = "success" | "error";

export function showAuthToast(
  title: string,
  description?: string,
  type: AuthToastType = "success",
) {
  const isError = type === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;

  toast.custom(
    (t) => (
      <motion.div
        initial={{ opacity: 0, y: -18, scale: 0.94 }}
        animate={
          t.visible
            ? { opacity: 1, y: 0, scale: 1 }
            : { opacity: 0, y: -18, scale: 0.94 }
        }
        exit={{ opacity: 0, y: -10, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 520, damping: 34 }}
      >
        <div className="relative w-[min(92vw,22rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_40px_-24px_rgba(15,23,42,0.28)]">
          <div
            className={`absolute inset-x-0 top-0 h-1 ${
              isError
                ? "bg-gradient-to-r from-rose-300 via-rose-500 to-rose-300"
                : "bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300"
            }`}
          />

          <div className="relative p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  isError ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-700"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={2.4} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                {description ? (
                  <p className="mt-0.5 text-sm leading-5 text-slate-500">
                    {description}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 3.2, ease: "linear" }}
                className={`h-full origin-left rounded-full ${
                  isError ? "bg-rose-400" : "bg-slate-400"
                }`}
              />
            </div>
          </div>
        </div>
      </motion.div>
    ),
    { id: `${type}:${title}:${description ?? ""}`, duration: 4200 },
  );
}

export function showErrorToast(title: string, description?: string) {
  showAuthToast(title, description, "error");
}
