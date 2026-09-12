import React from "react";
import { cn } from "@/lib/utils";

interface MobileContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function MobileContainer({ children, className, ...props }: MobileContainerProps) {
  return (
    <div
      className={cn(
        "bg-white text-slate-900 sm:border-slate-200/80 relative mx-auto flex min-h-screen w-full max-w-md flex-col shadow-xs sm:border-x",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
