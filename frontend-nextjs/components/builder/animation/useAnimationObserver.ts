"use client";

import { useEffect, useRef, useState } from "react";
import { ElementAnimationConfig } from "./animationTypes";
import styles from "./animations.module.css";

export function getAnimationClassName(anim?: ElementAnimationConfig): string {
  if (!anim || !anim.type || anim.type === "none" || anim.disabled) return "";

  switch (anim.type) {
    case "fade_in":
      return styles.animFadeIn || "animFadeIn";
    case "fade_out":
      return styles.animFadeOut || "animFadeOut";
    case "slide_up":
      return styles.animSlideUp || "animSlideUp";
    case "slide_down":
      return styles.animSlideDown || "animSlideDown";
    case "slide_left":
      return styles.animSlideLeft || "animSlideLeft";
    case "slide_right":
      return styles.animSlideRight || "animSlideRight";
    case "slide_out":
      return styles.animSlideOut || "animSlideOut";
    case "zoom_in":
      return styles.animZoomIn || "animZoomIn";
    case "zoom_out":
      return styles.animZoomOut || "animZoomOut";
    case "flip":
      return styles.animFlip || "animFlip";
    case "rotate":
      return styles.animRotate || "animRotate";
    case "parallax":
      return styles.animParallax || "animParallax";
    case "pulse":
      return styles.animPulse || "animPulse";
    case "bounce":
      return styles.animBounce || "animBounce";
    case "shake":
      return styles.animShake || "animShake";
    case "subtle_hover":
      return styles.animSubtleHover || "animSubtleHover";
    case "music_vinyl_spin":
      return styles.animVinylSpin || "animVinylSpin";
    case "countdown_tick":
      return styles.animCountdownTick || "animCountdownTick";
    case "wedding_character_3d":
    case "animated_illustration":
      return styles.animCharacterSway || "animCharacterSway";
    case "motion_graphic":
      return styles.animMotionGlow || "animMotionGlow";
    default:
      return "";
  }
}

export function getAnimationStyle(anim?: ElementAnimationConfig): React.CSSProperties {
  if (!anim || !anim.type || anim.type === "none" || anim.disabled) return {};

  const style: React.CSSProperties = {};

  if (anim.duration && anim.duration > 0) {
    style.animationDuration = `${anim.duration}s`;
  }
  if (anim.delay && anim.delay > 0) {
    style.animationDelay = `${anim.delay}s`;
  }
  if (anim.repeat === "infinite") {
    style.animationIterationCount = "infinite";
  } else if (anim.repeat === "once") {
    style.animationIterationCount = 1;
  }
  if (anim.easing) {
    style.animationTimingFunction = anim.easing;
  }

  return style;
}

/**
 * Hook to trigger on_scroll animations via IntersectionObserver
 */
export function useAnimationObserver(trigger?: string) {
  const [hasTriggered, setHasTriggered] = useState(trigger !== "on_scroll");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (trigger !== "on_scroll") return;

    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      const timer = setTimeout(() => setHasTriggered(true), 0);
      return () => clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasTriggered(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [trigger]);

  return { ref, hasTriggered };
}
