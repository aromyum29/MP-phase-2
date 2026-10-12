import { forwardRef, type ComponentProps } from "react";
import { usePortalIteration } from "./IterationProvider";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";

// Keep the comparison iteration's variants while using the login primary style
// for every Finance call to action in iteration 1.
export const FinanceButton = forwardRef<HTMLButtonElement, ComponentProps<typeof Button>>(
  ({ variant, className, ...props }, ref) => {
    const { iteration } = usePortalIteration();
    return (
      <Button
        ref={ref}
        {...props}
        variant={iteration === "1" ? "default" : variant}
        className={cn(className, iteration === "1" && variant === "ghost" && "px-4")}
      />
    );
  },
);

FinanceButton.displayName = "FinanceButton";
