import { cn } from "@/lib/utils";

type VerifiedIconProps = {
  className?: string;
  muted?: boolean;
};

export function VerifiedIcon({ className, muted = false }: VerifiedIconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block h-4 w-4 shrink-0",
        muted ? "bg-gray-400/80" : "bg-[#006F4B]",
        className
      )}
      style={{
        maskImage: "url('/verificado.svg')",
        WebkitMaskImage: "url('/verificado.svg')",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskPosition: "center",
        WebkitMaskPosition: "center",
      }}
    />
  );
}
