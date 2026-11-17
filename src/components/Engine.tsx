"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { accentNames, accents, agentCount, finalAccent, finaleWords } from "@/lib/content";
import { mountEngine } from "@/lib/engine";

const AGENT_DOTS = ["#ff6b5e", "#ffb02e", "#ffe14d", "#7dff8f", "#35e0c2"];

/**
 * Mounts the build engine and owns the overlay chrome (ready screen, HUD, swarm canvas).
 *
 * The engine writes to the DOM directly; this component never re-renders, so the
 * animation loop never touches React state.
 */
export default function Engine() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bootRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLParagraphElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const boot = bootRef.current;
    const note = noteRef.current;
    const hudRoot = hudRef.current;
    if (!stage || !canvas || !boot || !note || !hudRoot) return;
    return mountEngine({
      stage,
      canvas,
      boot,
      bootNote: note,
      hudRoot,
      accents,
      accentNames: [...accentNames],
      finalAccent,
      finale: finaleWords,
      agentCount,
    });
  }, []);

  return (
    <>
      <div id="stage" ref={stageRef} aria-hidden="true" />
      <canvas id="swarm" ref={canvasRef} aria-hidden="true" />
      <div className="scan" aria-hidden="true" />

      <div className="boot" id="boot" ref={bootRef}>
        <div className="bootcard">
          <div className="chip photo">
            <Image src="/Avatar.webp" alt="Abhishek Kumar T" width={88} height={88} priority />
          </div>
          <p className="bootname">Abhishek Kumar T</p>
          <p id="hint">18 agents will build this page</p>
          <p className="bootnote" ref={noteRef}>
            press <kbd>Space</kbd> or click anywhere to start
          </p>
          <p className="bootnote dim">sound needs one click â€” browsers block audio until you interact</p>
        </div>
      </div>

      <div className="hud" id="hud" ref={hudRef} role="toolbar" aria-label="Build controls">
        <span className="avs" aria-hidden="true">
          {AGENT_DOTS.map((c) => (
            <i key={c} style={{ background: c }} />
          ))}
        </span>
        <span className="hide-s">
          <span id="nAgents">18</span> agents
        </span>
        <span className="cnt">
          <span id="nDone">0</span> / <span id="nAll">0</span>
          <span className="hide-s"> layers</span>
        </span>
        <span className="bar hide-s">
          <i id="bar" />
        </span>
        <span className="st" id="st" role="status" aria-live="polite">
          Ready
        </span>
        <button id="bTour" title="Start or pause (Space)" aria-label="Start or pause the build">
          <svg viewBox="0 0 12 12" id="icoPlay" aria-hidden="true">
            <path d="M2 1l9 5-9 5z" />
          </svg>
        </button>
        <button id="bAuto" className="tog on" title="Auto-scroll on/off (A)" aria-label="Toggle auto-scroll">
          Auto
        </button>
        <button id="bSpeed" title="Speed (1 / 2 / 3)">1x</button>
        <button id="bSound" title="Sound (M) â€” press M or click anywhere to wake it" aria-label="Toggle sound">
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <path d="M1 4h2.5L7 1v10L3.5 8H1z" />
            <path d="M8.5 3.5a3.5 3.5 0 010 5" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <path className="mutedline" d="M1 11L11 1" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
        <button id="bReplay" title="Replay (R)" aria-label="Replay the build">
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <path d="M6 1.5A4.5 4.5 0 1010.5 6H9a3 3 0 11-3-3v2l3.5-2.75L6 0z" />
          </svg>
        </button>
      </div>
    </>
  );
}
