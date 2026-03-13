import { X } from "lucide-react";
import React from "react";

interface AssessmentSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function AssignmentSidePanel({ isOpen, onClose, children }: AssessmentSidePanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
      <div
        className="w-[500px] max-w-full bg-background h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300"
      >
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-background z-10">
          <h2 className="text-xl font-bold">Create Assessment</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
