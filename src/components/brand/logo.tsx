import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className, subtitle = true }: { className?: string; subtitle?: boolean }) {
  if (subtitle) {
    return (
      <Image
        src="/logo-full.png"
        alt="PRAKABÁ — cookies e brownies"
        width={1150}
        height={338}
        priority
        className={cn("h-12 w-auto", className)}
      />
    );
  }

  return (
    <Image
      src="/logo-mark.png"
      alt="PRAKABÁ"
      width={1150}
      height={235}
      priority
      className={cn("h-8 w-auto", className)}
    />
  );
}
