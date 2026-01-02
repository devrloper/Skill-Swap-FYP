import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "primary";
};

export const Button: React.FC<ButtonProps> = ({
  children,
  className = "",
  size = "default",
  variant = "default",
  ...props
}) => {
  let sizeClasses = "";
  if (size === "sm") sizeClasses = "px-3 py-1 text-sm";
  else if (size === "lg") sizeClasses = "px-6 py-3 text-lg";
  else sizeClasses = "px-4 py-2 text-base";

  let variantClasses = "";
  if (variant === "primary") variantClasses = "bg-purple-500 text-white hover:bg-purple-600";
  else if (variant === "outline") variantClasses = "border border-gray-300 text-gray-700";
  else variantClasses = "bg-gray-200 text-black hover:bg-gray-300";

  return (
    <button
      {...props}
      className={`font-semibold rounded-full transition focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </button>
  );
};
