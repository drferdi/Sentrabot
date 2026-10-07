import type { ReactNode } from "react";

export const authInputClass =
  "w-full rounded-[13px] border border-[#26262B] bg-[#17171A] px-[18px] py-[17px] text-[17px] text-[#F1F1EF] outline-none";

export const authPrimaryButtonClass =
  "mt-3 w-full rounded-[13px] bg-[#F1F1EF] py-[18px] text-center text-[17px] font-medium text-[#17171A] hover:bg-[#D8D8D4] disabled:opacity-40";

export function AuthShell({
  title,
  onSubmit,
  children,
}: {
  title: ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full items-center justify-center bg-[#08080A] px-6 py-16 text-[#F1F1EF]">
      <form onSubmit={onSubmit} className="flex w-[460px] flex-col items-center">
        <div className="flex h-[74px] w-[74px] items-center justify-center gap-[11px] rounded-full bg-[#F2F2F0]">
          <span className="h-5 w-[9px] rounded-full bg-[#101012]" />
          <span className="h-5 w-[9px] rounded-full bg-[#101012]" />
        </div>
        <h1 className="mb-[38px] mt-[30px] text-center text-[38px] tracking-[-0.02em]">{title}</h1>
        {children}
      </form>
    </div>
  );
}

export function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {off ? (
        <>
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
          <line x1="2" y1="2" x2="22" y2="22" />
        </>
      ) : (
        <>
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}
