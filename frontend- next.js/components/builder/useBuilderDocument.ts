"use client";

import { useCallback, useState } from "react";
import {
  BuilderDevice,
  BuilderDocument,
  BuilderNode,
  BuilderSection,
  BuilderSectionChild,
  createBuilderId,
  createBuilderElement,
  createBuilderSection,
  createBuilderWidget,
  ElementType,
  WidgetType,
} from "./model";

interface DocumentHistory {
  past: BuilderDocument[];
  present: BuilderDocument;
  future: BuilderDocument[];
}

function updateNode(
  sections: BuilderSection[],
  id: string,
  update: (node: BuilderNode) => BuilderNode
): BuilderSection[] {
  const targetId = id.includes("::") ? id.split("::")[0] : id;
  const exists = sections.some(
    (section) =>
      section.id === targetId || section.children.some((child) => child.id === targetId)
  );
  if (!exists) return sections;
  return sections.map((section) => {
    if (section.id === targetId) return update(section) as BuilderSection;
    return {
      ...section,
      children: section.children.map((child) =>
        child.id === targetId ? (update(child) as BuilderSectionChild) : child
      ),
    };
  });
}

function removeNode(
  sections: BuilderSection[],
  id: string
): BuilderSection[] {
  const exists = sections.some(
    (section) =>
      section.id === id || section.children.some((child) => child.id === id)
  );
  if (!exists) return sections;
  return sections
    .filter((section) => section.id !== id)
    .map((section) => ({
      ...section,
      children: section.children.filter(
        (child) => child.id !== id && child.parentContainerId !== id
      ),
    }));
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= items.length) return items;
  const result = [...items];
  [result[index], result[targetIndex]] = [result[targetIndex], result[index]];
  return result;
}

function findParentSection(
  sections: BuilderSection[],
  childId: string
): BuilderSection | undefined {
  return sections.find((section) =>
    section.children.some((child) => child.id === childId)
  );
}

export function useBuilderDocument(initialDocument: BuilderDocument) {
  const [history, setHistory] = useState<DocumentHistory>({
    past: [],
    present: initialDocument,
    future: [],
  });
  const document = history.present;

  const commit = useCallback(
    (update: (current: BuilderDocument) => BuilderDocument) => {
      setHistory((current) => {
        const next = update(current.present);
        if (next === current.present) return current;
        return {
          past: [...current.past.slice(-49), current.present],
          present: next,
          future: [],
        };
      });
    },
    []
  );

  const addSection = useCallback(() => {
    const section = createBuilderSection(0);
    commit((current) => {
      const sections = [...current.sections];
      const penutupIdx =
        sections.length > 1 ? sections.length - 1 : sections.length;
      sections.splice(penutupIdx, 0, {
        ...section,
        name: `Section ${current.sections.length + 1}`,
      });
      return { sections };
    });
    return section.id;
  }, [commit]);

  const insertSection = useCallback(
    (section: BuilderSection, targetIndex?: number) => {
      commit((current) => {
        const sections = [...current.sections];
        const penutupIdx =
          sections.length > 1 ? sections.length - 1 : sections.length;
        const insertAt =
          targetIndex !== undefined ? targetIndex : Math.max(1, penutupIdx);
        sections.splice(insertAt, 0, section);
        return { sections };
      });
      return section.id;
    },
    [commit]
  );

  const addElement = useCallback(
    (type: ElementType, sectionId?: string, parentContainerId?: string) => {
      const currentSections = document.sections;
      const targetExists =
        sectionId !== undefined &&
        currentSections.some((section) => section.id === sectionId);
      if (!targetExists) {
        return "";
      }
      const targetId = sectionId;
      const target = currentSections.find((section) => section.id === targetId);
      const element = createBuilderElement(
        type,
        target?.children.length ?? 0,
        targetId
      );
      if (parentContainerId) {
        element.parentContainerId = parentContainerId;
      }
      commit((current) => {
        return {
          sections: current.sections.map((section) =>
            section.id === targetId
              ? {
                  ...section,
                  children: [
                    ...section.children,
                    {
                      ...element,
                      parentSectionId: section.id,
                      parentContainerId: parentContainerId || element.parentContainerId,
                      position: { ...element.position },
                      name: `${element.name.replace(/ \d+$/, "")} ${section.children.length + 1}`,
                    },
                  ],
                }
              : section
          ),
        };
      });
      return element.id;
    },
    [commit, document.sections]
  );

  const addWidget = useCallback(
    (type: WidgetType, sectionId?: string, parentContainerId?: string) => {
      const currentSections = document.sections;
      const targetExists =
        sectionId !== undefined &&
        currentSections.some((section) => section.id === sectionId);
      if (!targetExists) {
        return "";
      }
      const targetId = sectionId;
      const target = currentSections.find((section) => section.id === targetId);
      const widget = createBuilderWidget(
        type,
        target?.children.length ?? 0,
        targetId
      );
      if (parentContainerId) {
        widget.parentContainerId = parentContainerId;
      }
      commit((current) => {
        return {
          sections: current.sections.map((section) =>
            section.id === targetId
              ? {
                  ...section,
                  children: [
                    ...section.children,
                    {
                      ...widget,
                      parentSectionId: section.id,
                      parentContainerId: parentContainerId || widget.parentContainerId,
                      position: { ...widget.position },
                      name: `${widget.name.replace(/ \d+$/, "")} ${section.children.length + 1}`,
                    },
                  ],
                }
              : section
          ),
        };
      });
      return widget.id;
    },
    [commit, document.sections]
  );

  const updateObject = useCallback(
    (id: string, update: (node: BuilderNode) => BuilderNode) => {
      commit((current) => ({
        sections: updateNode(current.sections, id, update),
      }));
    },
    [commit]
  );

  const deleteObject = useCallback(
    (id: string) => {
      commit((current) => {
        const sectionIndex = current.sections.findIndex((s) => s.id === id);
        // Cover at index 0 dan Penutup di akhir tidak bisa dihapus
        if (
          sectionIndex === 0 ||
          (sectionIndex === current.sections.length - 1 &&
            current.sections.length > 1)
        ) {
          return current;
        }
        return { sections: removeNode(current.sections, id) };
      });
    },
    [commit]
  );

  const duplicateObject = useCallback(
    (id: string) => {
      const sectionSource = document.sections.find(
        (section) => section.id === id
      );
      const parentSource = findParentSection(document.sections, id);
      const childSource = parentSource?.children.find(
        (child) => child.id === id
      );
      if (!sectionSource && !childSource) return "";

      // Cegah duplikasi fungsi identik seperti RSVP, Musik, dan Guestbook
      if (
        childSource &&
        childSource.kind === "widget" &&
        (childSource.widgetType === "rsvp" ||
          childSource.widgetType === "music" ||
          childSource.widgetType === "guestbook")
      ) {
        return "";
      }

      // Cegah duplikasi section Cover (pertama) dan Penutup (terakhir)
      if (sectionSource) {
        const sectionIdx = document.sections.findIndex((s) => s.id === id);
        if (
          sectionIdx === 0 ||
          sectionIdx === document.sections.length - 1
        ) {
          return "";
        }
      }

      const duplicateId = createBuilderId(
        sectionSource ? "section" : childSource?.kind ?? "element"
      );
      const duplicateSection = sectionSource
        ? {
            ...sectionSource,
            id: duplicateId,
            name: `${sectionSource.name} copy`,
            position: { ...sectionSource.position },
            size: { ...sectionSource.size },
            responsive: { ...sectionSource.responsive },
            props: { ...sectionSource.props },
            children: sectionSource.children
              .filter(
                (child) =>
                  !(
                    child.kind === "widget" &&
                    (child.widgetType === "rsvp" ||
                      child.widgetType === "music" ||
                      child.widgetType === "guestbook")
                  )
              )
              .map((child) => ({
                ...child,
                id: createBuilderId(child.kind),
                parentSectionId: duplicateId,
                position: { ...child.position },
                size: { ...child.size },
                responsive: { ...child.responsive },
                props: { ...child.props },
              })),
          }
        : undefined;
      const duplicateChild = childSource
        ? {
            ...childSource,
            id: duplicateId,
            name: `${childSource.name} copy`,
            position: {
              x: childSource.position.x + 16,
              y: childSource.position.y + 16,
            },
            size: { ...childSource.size },
            responsive: { ...childSource.responsive },
            props: { ...childSource.props },
          }
        : undefined;

      // Duplicate container's nested children if childSource is a container
      const nestedDuplicates: BuilderSectionChild[] = [];
      if (
        childSource &&
        childSource.kind === "element" &&
        childSource.elementType === "container"
      ) {
        const nestedChildren =
          parentSource?.children.filter(
            (c) => c.parentContainerId === childSource.id
          ) || [];
        nestedChildren.forEach((item) => {
          nestedDuplicates.push({
            ...item,
            id: createBuilderId(item.kind),
            parentSectionId: duplicateChild?.parentSectionId ?? parentSource?.id ?? "",
            parentContainerId: duplicateId,
            position: { ...item.position },
            size: { ...item.size },
            responsive: { ...item.responsive },
            props: { ...item.props },
          });
        });
      }

      commit((current) => {
        const sectionIndex = current.sections.findIndex(
          (section) => section.id === id
        );
        if (sectionIndex >= 0) {
          // Cover (index 0) dan Penutup (index akhir) tidak boleh diduplikasi
          if (
            sectionIndex === 0 ||
            sectionIndex === current.sections.length - 1
          ) {
            return current;
          }
          if (!duplicateSection) return current;
          const sections = [...current.sections];
          const insertIdx = sectionIndex + 1;
          sections.splice(insertIdx, 0, duplicateSection);
          return { sections };
        }

        const parent = findParentSection(current.sections, id);
        if (!parent) return current;
        if (!duplicateChild) return current;
        return {
          sections: current.sections.map((section) => {
            if (section.id !== parent.id) return section;
            const index = section.children.findIndex((child) => child.id === id);
            const children = [...section.children];
            children.splice(index + 1, 0, duplicateChild, ...nestedDuplicates);
            return { ...section, children };
          }),
        };
      });
      return duplicateId;
    },
    [commit, document.sections]
  );

  const moveObject = useCallback(
    (id: string, direction: -1 | 1) => {
      commit((current) => {
        const sectionIndex = current.sections.findIndex(
          (section) => section.id === id
        );
        if (sectionIndex >= 0) {
          // Cover di index 0 & Penutup di akhir terkunci
          if (
            sectionIndex === 0 ||
            sectionIndex === current.sections.length - 1
          ) {
            return current;
          }
          // Tidak boleh melewati Cover
          if (sectionIndex === 1 && direction === -1) {
            return current;
          }
          // Tidak boleh melewati Penutup
          if (
            sectionIndex === current.sections.length - 2 &&
            direction === 1
          ) {
            return current;
          }
          const sections = moveItem(current.sections, sectionIndex, direction);
          if (sections === current.sections) return current;
          return { sections };
        }
        const parent = findParentSection(current.sections, id);
        if (!parent) return current;
        const index = parent.children.findIndex((child) => child.id === id);
        const children = moveItem(parent.children, index, direction);
        if (children === parent.children) return current;
        return {
          sections: current.sections.map((section) =>
            section.id === parent.id ? { ...section, children } : section
          ),
        };
      });
    },
    [commit]
  );

  const moveObjectToSection = useCallback(
    (id: string, targetSectionId: string) => {
      commit((current) => {
        const source = findParentSection(current.sections, id);
        const target = current.sections.find(
          (section) => section.id === targetSectionId
        );
        if (!source || !target || source.id === target.id) return current;
        const child = source.children.find((item) => item.id === id);
        if (!child) return current;
        const movedChild: BuilderSectionChild = {
          ...child,
          parentSectionId: target.id,
          position: { ...child.position },
        };
        return {
          sections: current.sections.map((section) => {
            if (section.id === source.id) {
              return {
                ...section,
                children: section.children.filter((item) => item.id !== id),
              };
            }
            if (section.id === target.id) {
              return {
                ...section,
                children: [...section.children, movedChild],
              };
            }
            return section;
          }),
        };
      });
    },
    [commit]
  );

  const duplicateObjectToSection = useCallback(
    (id: string, targetSectionId: string) => {
      const parentSource = findParentSection(document.sections, id);
      const childSource = parentSource?.children.find(
        (child) => child.id === id
      );
      if (!childSource) return "";

      // Cegah duplikasi fungsi identik seperti RSVP, Musik, dan Guestbook
      if (
        childSource.kind === "widget" &&
        (childSource.widgetType === "rsvp" ||
          childSource.widgetType === "music" ||
          childSource.widgetType === "guestbook")
      ) {
        return "";
      }

      const duplicateId = createBuilderId(childSource.kind);
      const duplicateChild: BuilderSectionChild = {
        ...childSource,
        id: duplicateId,
        parentSectionId: targetSectionId,
        name: `${childSource.name} copy`,
        position: { ...childSource.position },
        size: { ...childSource.size },
        responsive: { ...childSource.responsive },
        props: { ...childSource.props },
      };

      commit((current) => {
        const target = current.sections.find((s) => s.id === targetSectionId);
        if (!target) return current;
        return {
          sections: current.sections.map((section) =>
            section.id === targetSectionId
              ? {
                  ...section,
                  children: [...section.children, duplicateChild],
                }
              : section
          ),
        };
      });
      return duplicateId;
    },
    [commit, document.sections]
  );

  const toggleLock = useCallback(
    (id: string) => {
      commit((current) => ({
        sections: updateNode(current.sections, id, (node) => ({
          ...node,
          locked: !node.locked,
        })),
      }));
    },
    [commit]
  );

  const toggleVisibility = useCallback(
    (id: string) => {
      commit((current) => ({
        sections: updateNode(current.sections, id, (node) => ({
          ...node,
          visible: !node.visible,
        })),
      }));
    },
    [commit]
  );

  const updatePosition = useCallback(
    (
      id: string,
      position: { x?: number; y?: number },
      device: BuilderDevice
    ) => {
      commit((current) => {
        const isDesktop = device === "desktop";

        // If updating a section
        const isSection = current.sections.some((s) => s.id === id);
        if (isSection) {
          return {
            sections: updateNode(current.sections, id, (node) => {
              if (isDesktop) {
                return { ...node, position: { ...node.position, ...position } };
              }
              const override = node.responsive?.[device] ?? {};
              return {
                ...node,
                responsive: {
                  ...node.responsive,
                  [device]: {
                    ...override,
                    position: { ...(override.position ?? {}), ...position },
                  },
                },
              };
            }),
          };
        }

        // Target is an element or widget inside a section
        let parentSec: BuilderSection | undefined;
        let targetChild: BuilderSectionChild | undefined;

        for (const sec of current.sections) {
          const found = sec.children.find((c) => c.id === id);
          if (found) {
            parentSec = sec;
            targetChild = found;
            break;
          }
        }

        if (!parentSec || !targetChild) return current;

        const curX = isDesktop
          ? targetChild.position.x
          : (targetChild.responsive?.[device]?.position?.x ?? targetChild.position.x);
        const curY = isDesktop
          ? targetChild.position.y
          : (targetChild.responsive?.[device]?.position?.y ?? targetChild.position.y);

        const newX = position.x !== undefined ? position.x : curX;
        const newY = position.y !== undefined ? position.y : curY;
        const dx = newX - curX;
        const dy = newY - curY;

        const groupId = targetChild.groupId;

        return {
          sections: current.sections.map((sec) => {
            if (sec.id !== parentSec!.id) return sec;
            return {
              ...sec,
              children: sec.children.map((child) => {
                const shouldMove = groupId
                  ? child.groupId === groupId
                  : child.id === id;
                if (!shouldMove) return child;

                if (isDesktop) {
                  const targetX =
                    child.id === id ? newX : child.position.x + dx;
                  const targetY =
                    child.id === id ? newY : child.position.y + dy;
                  return {
                    ...child,
                    position: { x: targetX, y: targetY },
                  };
                } else {
                  const curOverride = child.responsive?.[device] ?? {};
                  const childX =
                    curOverride.position?.x ?? child.position.x;
                  const childY =
                    curOverride.position?.y ?? child.position.y;
                  const targetX =
                    child.id === id ? newX : childX + dx;
                  const targetY =
                    child.id === id ? newY : childY + dy;
                  return {
                    ...child,
                    responsive: {
                      ...child.responsive,
                      [device]: {
                        ...curOverride,
                        position: { x: targetX, y: targetY },
                      },
                    },
                  };
                }
              }),
            };
          }),
        };
      });
    },
    [commit]
  );

  const setElementContainer = useCallback(
    (elementId: string, parentContainerId?: string) => {
      commit((current) => ({
        sections: updateNode(current.sections, elementId, (node) => ({
          ...node,
          parentContainerId,
        })),
      }));
    },
    [commit]
  );

  const groupElements = useCallback(
    (elementIds: string[]) => {
      if (!elementIds.length) return "";
      const groupId = createBuilderId("group");
      commit((current) => ({
        sections: current.sections.map((section) => ({
          ...section,
          children: section.children.map((child) =>
            elementIds.includes(child.id) ? { ...child, groupId } : child
          ),
        })),
      }));
      return groupId;
    },
    [commit]
  );

  const addToGroup = useCallback(
    (elementId: string, groupId: string) => {
      commit((current) => ({
        sections: current.sections.map((section) => ({
          ...section,
          children: section.children.map((child) =>
            child.id === elementId ? { ...child, groupId } : child
          ),
        })),
      }));
    },
    [commit]
  );

  const removeFromGroup = useCallback(
    (elementId: string) => {
      commit((current) => ({
        sections: current.sections.map((section) => ({
          ...section,
          children: section.children.map((child) =>
            child.id === elementId ? { ...child, groupId: undefined } : child
          ),
        })),
      }));
    },
    [commit]
  );

  const ungroupElements = useCallback(
    (groupId: string) => {
      commit((current) => ({
        sections: current.sections.map((section) => ({
          ...section,
          children: section.children.map((child) =>
            child.groupId === groupId ? { ...child, groupId: undefined } : child
          ),
        })),
      }));
    },
    [commit]
  );

  const moveGroupToSection = useCallback(
    (groupId: string, targetSectionId: string) => {
      commit((current) => {
        let movedChildren: BuilderSectionChild[] = [];
        const filteredSections = current.sections.map((section) => {
          const matching = section.children.filter((c) => c.groupId === groupId);
          if (matching.length) {
            movedChildren = [
              ...movedChildren,
              ...matching.map((c) => ({ ...c, parentSectionId: targetSectionId })),
            ];
            return {
              ...section,
              children: section.children.filter((c) => c.groupId !== groupId),
            };
          }
          return section;
        });

        if (!movedChildren.length) return current;

        return {
          sections: filteredSections.map((section) =>
            section.id === targetSectionId
              ? { ...section, children: [...section.children, ...movedChildren] }
              : section
          ),
        };
      });
    },
    [commit]
  );

  const reorderSectionChildren = useCallback(
    (sectionId: string, fromIndex: number, toIndex: number) => {
      commit((current) => ({
        sections: current.sections.map((section) => {
          if (section.id !== sectionId) return section;
          if (
            fromIndex < 0 ||
            fromIndex >= section.children.length ||
            toIndex < 0 ||
            toIndex >= section.children.length ||
            fromIndex === toIndex
          ) {
            return section;
          }
          const children = [...section.children];
          const [moved] = children.splice(fromIndex, 1);
          children.splice(toIndex, 0, moved);
          return { ...section, children };
        }),
      }));
    },
    [commit]
  );

  const reorderSections = useCallback(
    (fromIndex: number, toIndex: number) => {
      commit((current) => {
        const len = current.sections.length;
        if (len <= 2) return current;
        // Cover (0) and Penutup (len - 1) are locked
        if (
          fromIndex <= 0 ||
          fromIndex >= len - 1 ||
          toIndex <= 0 ||
          toIndex >= len - 1 ||
          fromIndex === toIndex
        ) {
          return current;
        }
        const sections = [...current.sections];
        const [moved] = sections.splice(fromIndex, 1);
        sections.splice(toIndex, 0, moved);
        return { sections };
      });
    },
    [commit]
  );

  const undo = useCallback(() => {
    setHistory((current) => {
      if (!current.past.length) return current;
      const previous = current.past[current.past.length - 1];
      return {
        past: current.past.slice(0, -1),
        present: previous,
        future: [current.present, ...current.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((current) => {
      if (!current.future.length) return current;
      const next = current.future[0];
      return {
        past: [...current.past, current.present],
        present: next,
        future: current.future.slice(1),
      };
    });
  }, []);

  const resetHistory = useCallback((next: BuilderDocument) => {
    setHistory({ past: [], present: next, future: [] });
  }, []);

  return {
    document,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    addSection,
    insertSection,
    addElement,
    addWidget,
    updateObject,
    deleteObject,
    duplicateObject,
    duplicateObjectToSection,
    moveObject,
    moveObjectToSection,
    setElementContainer,
    toggleLock,
    toggleVisibility,
    updatePosition,
    groupElements,
    ungroupElements,
    addToGroup,
    removeFromGroup,
    moveGroupToSection,
    reorderSectionChildren,
    reorderSections,
    undo,
    redo,
    resetHistory,
  };
}
