import { desktopBridge, windowChromeKind } from "../lib/desktop";

export function WindowChrome() {
  const desktop = desktopBridge();
  const kind = windowChromeKind(desktop);
  if (kind === "spacer") {
    return <div className="h-3 w-[72px]" aria-hidden="true" />;
  }
  if (kind === "darwin") {
    return <div className="app-drag h-3 w-[72px]" aria-hidden="true" />;
  }
  return (
    <div className="app-drag flex gap-[7px]">
      <button
        type="button"
        className="app-no-drag h-3 w-3 rounded-full bg-[#FF5F57]"
        aria-label="Close"
        onClick={() => void desktop?.window.close()}
      />
      <button
        type="button"
        className="app-no-drag h-3 w-3 rounded-full bg-[#FEBC2E]"
        aria-label="Minimize"
        onClick={() => void desktop?.window.minimize()}
      />
      <button
        type="button"
        className="app-no-drag h-3 w-3 rounded-full bg-[#28C840]"
        aria-label="Fullscreen"
        onClick={() => void desktop?.window.toggleMaximize()}
      />
    </div>
  );
}
