"use client";

import React, { useMemo } from "react";
import { StarOutlined } from "@ant-design/icons";
import { DecorativeAnimationType } from "./animationTypes";

interface DecorativeAnimationOverlayProps {
  type: DecorativeAnimationType;
  density?: "light" | "medium" | "heavy";
}

export function DecorativeAnimationOverlay({
  type,
  density = "medium",
}: DecorativeAnimationOverlayProps) {
  const particleCount = density === "light" ? 10 : density === "heavy" ? 24 : 16;

  const particles = useMemo(() => {
    return Array.from({ length: particleCount }).map((_, index) => {
      const left = Math.round((index / particleCount) * 100 + (Math.sin(index * 3) * 8));
      const animationDuration = 5 + (index % 5) * 1.5;
      const animationDelay = (index * 0.4) % 6;
      const size = 12 + (index % 4) * 4;
      const opacity = 0.4 + (index % 5) * 0.12;

      return {
        id: index,
        left: Math.max(2, Math.min(96, left)),
        animationDuration,
        animationDelay,
        size,
        opacity,
      };
    });
  }, [particleCount]);

  if (!type || type === "none") {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
    >
      <style>{`
        @keyframes iuFallDown {
          0% {
            transform: translate3d(0, -40px, 0) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 0.9;
          }
          100% {
            transform: translate3d(30px, 105vh, 0) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes iuSparklePulse {
          0%, 100% {
            transform: scale(0.6) rotate(0deg);
            opacity: 0.2;
          }
          50% {
            transform: scale(1.2) rotate(180deg);
            opacity: 0.9;
          }
        }

        @keyframes iuFloatUp {
          0% {
            transform: translate3d(0, 105vh, 0);
            opacity: 0;
          }
          20% {
            opacity: 0.8;
          }
          80% {
            opacity: 0.7;
          }
          100% {
            transform: translate3d(-20px, -40px, 0);
            opacity: 0;
          }
        }

        @keyframes iuButterflyFlight {
          0% {
            transform: translate3d(-30px, 20vh, 0) scale(0.8) rotate(10deg);
            opacity: 0;
          }
          20% {
            opacity: 0.85;
          }
          50% {
            transform: translate3d(50vw, 35vh, 0) scale(1) rotate(-5deg);
          }
          80% {
            opacity: 0.85;
          }
          100% {
            transform: translate3d(105vw, 15vh, 0) scale(0.9) rotate(8deg);
            opacity: 0;
          }
        }

        @keyframes iuBirdFlight {
          0% {
            transform: translate3d(-40px, 12vh, 0) scale(0.7);
            opacity: 0;
          }
          15% {
            opacity: 0.75;
          }
          85% {
            opacity: 0.75;
          }
          100% {
            transform: translate3d(105vw, 6vh, 0) scale(0.7);
            opacity: 0;
          }
        }

        @keyframes iuSwinging {
          0%, 100% {
            transform: rotate(-6deg);
          }
          50% {
            transform: rotate(6deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .iu-particle {
            display: none !important;
          }
        }
      `}</style>

      {/* Falling Flower Petals */}
      {type === "falling_petals" &&
        particles.map((p) => (
          <div
            key={p.id}
            className="iu-particle absolute top-0"
            style={{
              left: `${p.left}%`,
              animation: `iuFallDown ${p.animationDuration}s linear infinite`,
              animationDelay: `${p.animationDelay}s`,
              opacity: p.opacity,
            }}
          >
            <svg
              width={p.size}
              height={p.size * 1.3}
              viewBox="0 0 24 30"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2C6 8 2 16 6 24C10 32 18 28 20 20C22 12 18 6 12 2Z"
                fill="#F4A7B9"
                fillOpacity="0.75"
              />
            </svg>
          </div>
        ))}

      {/* Falling Leaves */}
      {type === "falling_leaves" &&
        particles.map((p) => (
          <div
            key={p.id}
            className="iu-particle absolute top-0"
            style={{
              left: `${p.left}%`,
              animation: `iuFallDown ${p.animationDuration * 1.2}s ease-in-out infinite`,
              animationDelay: `${p.animationDelay}s`,
              opacity: p.opacity,
            }}
          >
            <svg
              width={p.size * 1.1}
              height={p.size * 1.4}
              viewBox="0 0 24 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2C8 10 2 18 8 26C14 34 22 26 20 18C18 10 14 4 12 2Z"
                fill="#7E9F76"
                fillOpacity="0.75"
              />
              <path d="M12 2V28" stroke="#455633" strokeWidth="1" strokeOpacity="0.5" />
            </svg>
          </div>
        ))}

      {/* Sparkles */}
      {type === "sparkles" &&
        particles.map((p) => (
          <div
            key={p.id}
            className="iu-particle absolute"
            style={{
              left: `${p.left}%`,
              top: `${((p.id * 17) % 85) + 5}%`,
              animation: `iuSparklePulse ${p.animationDuration * 0.5}s ease-in-out infinite`,
              animationDelay: `${p.animationDelay}s`,
            }}
          >
            <svg
              width={p.size}
              height={p.size}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z"
                fill="#FFAD38"
                fillOpacity="0.8"
              />
            </svg>
          </div>
        ))}

      {/* Floating Light */}
      {type === "floating_light" &&
        particles.map((p) => (
          <div
            key={p.id}
            className="iu-particle absolute rounded-full bg-gradient-to-t from-[#FFAD38] to-[#FFF8EE] blur-[1px]"
            style={{
              left: `${p.left}%`,
              bottom: "-20px",
              width: `${p.size * 0.8}px`,
              height: `${p.size * 0.8}px`,
              animation: `iuFloatUp ${p.animationDuration * 1.1}s ease-in-out infinite`,
              animationDelay: `${p.animationDelay}s`,
              boxShadow: "0 0 10px 2px rgba(255, 173, 56, 0.4)",
            }}
          />
        ))}

      {/* Flying Butterflies */}
      {type === "flying_butterflies" && (
        <>
          <div
            className="iu-particle absolute"
            style={{
              animation: "iuButterflyFlight 12s ease-in-out infinite",
              animationDelay: "0s",
            }}
          >
            <svg width="28" height="24" viewBox="0 0 32 28" fill="#E8967D" fillOpacity="0.85">
              <path d="M16 14C12 8 4 6 2 12C0 18 10 24 16 16C22 24 32 18 30 12C28 6 20 8 16 14Z" />
            </svg>
          </div>
          <div
            className="iu-particle absolute"
            style={{
              animation: "iuButterflyFlight 15s ease-in-out infinite",
              animationDelay: "6s",
            }}
          >
            <svg width="24" height="20" viewBox="0 0 32 28" fill="#F4A7B9" fillOpacity="0.8">
              <path d="M16 14C12 8 4 6 2 12C0 18 10 24 16 16C22 24 32 18 30 12C28 6 20 8 16 14Z" />
            </svg>
          </div>
        </>
      )}

      {/* Flying Birds */}
      {type === "flying_birds" && (
        <div
          className="iu-particle absolute"
          style={{
            animation: "iuBirdFlight 14s linear infinite",
          }}
        >
          <svg width="36" height="18" viewBox="0 0 40 20" fill="none">
            <path
              d="M0 14C8 6 16 10 20 16C24 10 32 6 40 14"
              stroke="#FAF5EE"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}

      {/* Swinging Ornament */}
      {type === "swinging_ornament" && (
        <div
          className="iu-particle absolute top-0 right-8 origin-top"
          style={{
            animation: "iuSwinging 4s ease-in-out infinite",
          }}
        >
          <div className="w-0.5 h-16 bg-[#EAE5DF] mx-auto" />
          <div className="w-8 h-8 rounded-full border border-[#FFAD38] bg-[#FFF8EE] flex items-center justify-center text-[#FFAD38] shadow-xs text-xs font-serif">
            <StarOutlined className="text-xs" />
          </div>
        </div>
      )}
    </div>
  );
}
