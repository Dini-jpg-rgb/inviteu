import React, { ReactNode } from "react";
import { SectionConfig, renderSectionWidget } from "@/components/builder/registry";

interface InvitationRendererProps {
  sections: SectionConfig[];
  className?: string;
  isEditMode?: boolean;
  emptyState?: ReactNode;
  renderSection?: (
    section: SectionConfig,
    index: number,
    sectionCount: number,
    renderedSection: ReactNode
  ) => ReactNode;
}

export function InvitationRenderer({
  sections,
  className = "space-y-4",
  isEditMode = false,
  emptyState = (
    <p className="px-6 py-16 text-center text-sm text-stone-500">
      Undangan ini belum memiliki section.
    </p>
  ),
  renderSection,
}: InvitationRendererProps) {
  const visibleSections = sections
    .map((section, sourceIndex) => ({ section, sourceIndex }))
    .filter(({ section }) => section.visible ?? true)
    .sort(
      (a, b) =>
        a.section.sortOrder - b.section.sortOrder ||
        a.sourceIndex - b.sourceIndex
    );

  return (
    <div className={className}>
      {visibleSections.length === 0
        ? emptyState
        : visibleSections.map(({ section }, index) => {
            const renderedSection = renderSectionWidget(section, isEditMode);
            return renderSection
              ? renderSection(section, index, visibleSections.length, renderedSection)
              : <div key={section.id}>{renderedSection}</div>;
          })}
    </div>
  );
}
