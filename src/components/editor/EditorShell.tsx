import React, { type ReactElement, type ReactNode } from "react";
import { ExternalLink, FileDown } from "lucide-react";

import { cn } from "../../lib/utils.ts";

export type EditorViewMode = "edit" | "preview";

interface EditorShellProps {
  toolbar: ReactNode;
  floorSidebar: ReactNode;
  propertyPanel: ReactNode;
  viewerSurface: ReactNode;
  viewMode: EditorViewMode;
  onViewModeChange: (mode: EditorViewMode) => void;
  onExportSvg: () => void;
  onShare: () => void;
}

export function EditorShell({
  toolbar,
  floorSidebar,
  propertyPanel,
  viewerSurface,
  viewMode,
  onViewModeChange,
  onExportSvg,
  onShare,
}: EditorShellProps): ReactElement {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface-2">
      {toolbar}
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-border-default bg-surface-0 px-4">
        <div className="flex items-center gap-0.5 rounded-md bg-surface-3 p-0.5">
          {(["edit", "preview"] as EditorViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={cn(
                "px-3 py-1 text-xs font-medium transition-colors duration-75",
                "rounded",
                viewMode === mode
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              {mode === "edit" ? "2D 편집" : "2.5D 미리보기"}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          {viewMode === "edit" && (
            <button
              type="button"
              onClick={onExportSvg}
              className={cn(
                "inline-flex h-6 items-center justify-center gap-1.5 whitespace-nowrap px-2",
                "rounded text-[11px] text-text-secondary transition-colors duration-75",
                "hover:bg-surface-3 hover:text-text-primary",
              )}
            >
              <FileDown size={11} strokeWidth={1.8} />
              SVG 저장
            </button>
          )}
          <a
            href="/view"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onShare}
            className={cn(
              "inline-flex h-6 items-center justify-center gap-1.5 whitespace-nowrap px-2",
              "rounded text-[11px] text-text-secondary transition-colors duration-75",
              "hover:bg-surface-3 hover:text-text-primary",
            )}
          >
            <ExternalLink size={11} strokeWidth={1.8} />
            뷰어로 공유
          </a>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        {floorSidebar}
        <main className="relative flex-1 overflow-hidden bg-surface-2">
          {viewerSurface}
        </main>
        {viewMode === "edit" ? propertyPanel : null}
      </div>
    </div>
  );
}
