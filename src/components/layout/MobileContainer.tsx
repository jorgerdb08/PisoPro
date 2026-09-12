import React from "react";
import { cn } from "@/lib/utils";

interface MobileContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function MobileContainer({ children, className, ...props }: MobileContainerProps) {
  return (
    <div
      className={cn(
        "bg-background text-foreground sm:border-border/60 relative mx-auto flex min-h-screen w-full max-w-md flex-col shadow-2xl sm:border-x",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
