import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  full?: boolean;
}

export default function Button({
  children,
  className = "",
  full = false,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`
        ${full ? "w-full" : "w-auto"}
        inline-flex items-center justify-center gap-2
        bg-gradient-to-r from-purple-950 to-pink-600
        text-white
        px-6 py-2.5
        rounded-xl
        font-semibold text-sm
        shadow-md
        hover:opacity-90
        transition-all duration-300
        active:scale-95
        cursor-pointer
        ${className}
      `}
    >
      {children}
    </button>
  );
}
