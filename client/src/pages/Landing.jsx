import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

/* ─── STYLES ─────────────────────────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=Space+Mono:wght@400;700&display=swap');

  :root {
    --green: #00ff88;
    --green-dim: #00cc6a;
    --green-glow: rgba(0,255,136,0.18);
    --green-border: rgba(0,255,136,0.25);
    --yellow: #ffd700;
    --yellow-dim: #ccaa00;
    --yellow-glow: rgba(255,215,0,0.18);
    --yellow-border: rgba(255,215,0,0.25);
    --black: #050805;
    --surface: #0b0f0b;
    --surface2: #111811;
    --surface3: #161e16;
    --text: #e8f5e8;
    --muted: #6b8a6b;
    --white: #ffffff;
    --font-display: 'Syne', sans-serif;
    --font-mono: 'Space Mono', monospace;
  }

  /* LIGHT MODE */
  [data-theme="light"] {
    --black: #ffffff;
    --surface: #f4f7f4;
    --surface2: #e8eee8;
    --surface3: #dce4dc;
    --text: #0f1a0f;
    --muted: #5c7a5c;
    --white: #0f1a0f;
    --green: #00994d;
    --green-dim: #00803f;
    --green-glow: rgba(0,153,77,0.12);
    --green-border: rgba(0,153,77,0.25);
    --yellow: #b8860b;
    --yellow-dim: #9a7209;
    --yellow-glow: rgba(184,134,11,0.12);
    --yellow-border: rgba(184,134,11,0.25);
  }

  [data-theme="light"] .kn-feature-row.c1 .kn-feature-left { background: #eaf7ee; }
  [data-theme="light"] .kn-feature-row.c2 .kn-feature-left { background: #e6f1fa; }
  [data-theme="light"] .kn-feature-row.c3 .kn-feature-left { background: #f0e6fa; }
  [data-theme="light"] .kn-feature-row.c4 .kn-feature-left { background: #eff5e6; }

  [data-theme="light"] .kn-hero-preview { color: #00994d; }
  [data-theme="light"] .kn-hero-center { background: #edf3ed; }

  [data-theme="light"] .kn-why {
    background: linear-gradient(180deg, #ffffff 0%, rgba(184,134,11,0.03) 50%, #ffffff 100%);
  }

  [data-theme="light"] .kn-why-card-icon {
    background: rgba(184,134,11,0.08);
  }

  [data-theme="light"] .kn-msg.ai {
    background: rgba(0,153,77,0.06);
    border-left: 2px solid var(--green);
    color: var(--text);
  }

  [data-theme="light"] .kn-msg.user {
    background: var(--surface3);
    color: var(--text);
  }

  [data-theme="light"] .kn-ai-metric {
    background: var(--surface3);
    color: var(--green);
    border-color: var(--green-border);
  }

  [data-theme="light"] .kn-footer { background: #f4f7f4; }
  [data-theme="light"] .kn-footer-wordmark::before { background: linear-gradient(to right, #f4f7f4, transparent); }
  [data-theme="light"] .kn-footer-wordmark::after { background: linear-gradient(to left, #f4f7f4, transparent); }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html { scroll-behavior: smooth; }

  body, #root {
    background: var(--black);
    color: var(--text);
    font-family: var(--font-display);
    overflow-x: hidden;
    transition: background 0.4s, color 0.4s;
  }

  /* ── NAV ── */
  .kn-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    padding: 0 40px;
    border-bottom: 1px solid var(--green-border);
    background: var(--black);
    backdrop-filter: blur(12px);
  }
  .kn-nav-brand {
    display: flex; align-items: center; gap: 12px;
    text-decoration: none; color: var(--text);
    font-weight: 900; font-size: 1.2rem; letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .kn-logo-mark {
    width: 32px; height: 32px;
    flex-shrink: 0;
  }
  .kn-nav-links {
    display: flex; align-items: center; gap: 8px;
    list-style: none;
  }
  .kn-nav-links li a {
    color: var(--text); text-decoration: none; font-size: 0.8rem;
    font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
    padding: 8px 16px; opacity: 0.6; transition: opacity 0.2s, color 0.2s;
    border-radius: 8px;
  }
  .kn-nav-links li a:hover { opacity: 1; color: var(--green); background: var(--green-glow); }
  .kn-nav-actions {
    display: flex; align-items: center; gap: 16px;
  }
  .kn-theme-toggle {
    position: relative;
    width: 52px; height: 28px;
    border-radius: 14px;
    background: var(--surface2);
    border: 1px solid var(--green-border);
    cursor: pointer;
    transition: background 0.3s;
  }
  .kn-theme-toggle::after {
    content: '';
    position: absolute;
    top: 3px; left: 3px;
    width: 20px; height: 20px;
    border-radius: 50%;
    background: var(--green);
    transition: transform 0.3s cubic-bezier(.4,0,.2,1);
    box-shadow: 0 0 8px var(--green-glow);
  }
  [data-theme="light"] .kn-theme-toggle::after {
    transform: translateX(24px);
  }
  .kn-theme-toggle .kn-toggle-icon {
    position: absolute;
    top: 50%; transform: translateY(-50%);
    font-size: 0.7rem;
    transition: opacity 0.3s;
    pointer-events: none;
  }
  .kn-toggle-icon.moon { left: 7px; opacity: 1; }
  .kn-toggle-icon.sun { right: 7px; opacity: 0.4; }
  [data-theme="light"] .kn-toggle-icon.moon { opacity: 0.4; }
  [data-theme="light"] .kn-toggle-icon.sun { opacity: 1; }
  .kn-nav-cta {
    display: flex; align-items: center;
    background: var(--green); color: #000 !important;
    border: none; cursor: pointer; padding: 10px 24px;
    font-family: var(--font-display); font-weight: 900;
    font-size: 0.8rem; letter-spacing: 0.06em; text-transform: uppercase;
    text-decoration: none; gap: 8px;
    border-radius: 8px;
    transition: background 0.2s, box-shadow 0.2s;
  }
  .kn-nav-cta:hover { background: #00ff99; box-shadow: 0 0 20px var(--green-glow); }

  /* ── HERO ── */
  .kn-hero {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 300px 1fr 300px;
    grid-template-rows: 1fr;
    border-bottom: 1px solid var(--green-border);
    overflow: hidden;
    margin: 0 32px;
    border-radius: 24px;
    border: 1px solid var(--green-border);
  }
  .kn-hero-left {
    border-right: 1px solid var(--green-border);
    padding: 48px 32px;
    display: flex; flex-direction: column; justify-content: space-between;
  }
  .kn-hero-left p {
    font-size: 0.9rem; line-height: 1.7; color: var(--text); opacity: 0.85;
  }
  .kn-hero-preview {
    background: var(--surface);
    border: 1px solid var(--green-border);
    border-radius: 4px;
    padding: 16px;
    font-family: var(--font-mono);
    font-size: 0.72rem; color: var(--green);
    overflow: hidden;
  }
  .kn-hero-preview-title { color: var(--muted); margin-top: 32px; margin-bottom: 8px; font-size: 0.65rem; letter-spacing: 0.1em; text-transform: uppercase; }
  .kn-ticker { animation: tickerScroll 10s linear infinite; }
  @keyframes tickerScroll {
    0% { transform: translateY(0); }
    100% { transform: translateY(-50%); }
  }
  .kn-ticker-line { padding: 3px 0; display: flex; justify-content: space-between; }
  .kn-ticker-line .up { color: var(--green); }
  .kn-ticker-line .down { color: #ff4466; }

  .kn-hero-center {
    position: relative; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    background: var(--surface);
  }
  .kn-hero-bg-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(var(--green-border) 1px, transparent 1px),
      linear-gradient(90deg, var(--green-border) 1px, transparent 1px);
    background-size: 48px 48px;
    opacity: 0.5;
  }
  .kn-hero-geo {
    position: relative; z-index: 2;
    display: flex; flex-direction: column; align-items: center; gap: 0;
  }
  .kn-kite-container {
    position: relative;
    width: 580px; height: 620px;
    display: flex; align-items: center; justify-content: center;
    animation: kiteBreath 6s ease-in-out infinite;
  }
  @keyframes kiteBreath {
    0%, 100% { transform: scale(1) rotate(0deg); }
    25% { transform: scale(1.02) rotate(0.5deg); }
    50% { transform: scale(1.04) rotate(0deg); }
    75% { transform: scale(1.02) rotate(-0.5deg); }
  }
  .kn-kite-frame {
    position: absolute;
    width: 300px; height: 300px;
    border: 2px solid var(--green);
    border-radius: 32px;
    transform: rotate(45deg);
    box-shadow: 0 0 80px var(--green-glow), inset 0 0 60px var(--green-glow);
    background: linear-gradient(135deg, rgba(0,255,136,0.04) 0%, transparent 60%);
    animation: framePulse 4s ease-in-out infinite;
  }
  @keyframes framePulse {
    0%, 100% { box-shadow: 0 0 80px var(--green-glow), inset 0 0 60px var(--green-glow); border-color: var(--green-border); }
    50% { box-shadow: 0 0 140px rgba(0,255,136,0.25), inset 0 0 80px rgba(0,255,136,0.1); border-color: var(--green); }
  }
  .kn-kite-frame::before {
    content: ''; position: absolute; inset: 18px;
    border: 1px solid var(--green-border);
    border-radius: 24px;
    animation: innerFrameSpin 8s linear infinite;
  }
  @keyframes innerFrameSpin {
    0% { transform: rotate(0deg); border-color: var(--green-border); }
    50% { border-color: var(--green); }
    100% { transform: rotate(360deg); border-color: var(--green-border); }
  }
  .kn-kite-core {
    position: absolute;
    width: 120px; height: 120px;
    border-radius: 24px;
    transform: rotate(45deg);
    background: radial-gradient(circle at 30% 30%, var(--green) 0%, var(--green-dim) 40%, transparent 70%);
    box-shadow: 0 0 60px var(--green), 0 0 120px var(--green-glow);
    animation: coreFire 2.5s ease-in-out infinite;
  }
  @keyframes coreFire {
    0%, 100% { transform: rotate(45deg) scale(0.85); opacity: 0.8; box-shadow: 0 0 50px var(--green), 0 0 100px var(--green-glow); }
    50% { transform: rotate(45deg) scale(1.15); opacity: 1; box-shadow: 0 0 80px var(--green), 0 0 160px rgba(0,255,136,0.4); }
  }
  .kn-kite-core::after {
    content: ''; position: absolute; inset: 20%;
    border-radius: 12px;
    background: var(--white);
    opacity: 0.9;
    animation: coreDotPulse 1.2s ease-in-out infinite;
  }
  @keyframes coreDotPulse {
    0%, 100% { transform: scale(0.6); opacity: 0.5; }
    50% { transform: scale(1); opacity: 1; }
  }
  .kn-kite-ring {
    position: absolute;
    width: 220px; height: 220px;
    border: 1px dashed var(--green-border);
    border-radius: 28px;
    transform: rotate(45deg);
    animation: ringRotate 12s linear infinite;
  }
  @keyframes ringRotate {
    0% { transform: rotate(45deg); opacity: 0.4; }
    50% { opacity: 0.8; }
    100% { transform: rotate(405deg); opacity: 0.4; }
  }
  .kn-kite-ring::before, .kn-kite-ring::after {
    content: ''; position: absolute;
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--green);
    box-shadow: 0 0 12px var(--green);
  }
  .kn-kite-ring::before { top: -4px; left: 50%; transform: translateX(-50%); }
  .kn-kite-ring::after { bottom: -4px; left: 50%; transform: translateX(-50%); }
  .kn-kite-tail {
    position: absolute;
    top: calc(50% + 150px);
    width: 2px; height: 120px;
    background: linear-gradient(to bottom, var(--green), transparent);
    transform-origin: top center;
    animation: tailSway 3s ease-in-out infinite;
  }
  @keyframes tailSway {
    0%, 100% { transform: rotate(-8deg); height: 120px; }
    25% { transform: rotate(4deg); height: 130px; }
    50% { transform: rotate(0deg); height: 140px; }
    75% { transform: rotate(-4deg); height: 130px; }
  }
  .kn-kite-tail::before {
    content: ''; position: absolute; bottom: 0; left: 50%;
    transform: translateX(-50%);
    width: 10px; height: 10px; border-radius: 50%;
    background: var(--green);
    box-shadow: 0 0 16px var(--green);
    animation: tailDotPulse 1.5s ease-in-out infinite;
  }
  @keyframes tailDotPulse {
    0%, 100% { transform: translateX(-50%) scale(0.8); opacity: 0.6; }
    50% { transform: translateX(-50%) scale(1.2); opacity: 1; }
  }
  .kn-kite-tail::after {
    content: ''; position: absolute; bottom: -24px; left: 50%;
    transform: translateX(-50%);
    width: 4px; height: 24px;
    background: linear-gradient(to bottom, var(--green), transparent);
    border-radius: 2px;
    animation: tailFade 2s ease-in-out infinite;
  }
  @keyframes tailFade {
    0%, 100% { opacity: 0.3; height: 24px; }
    50% { opacity: 0.7; height: 36px; }
  }
  .kn-kite-data-line {
    position: absolute;
    width: 1px; height: 40px;
    background: linear-gradient(to bottom, var(--green), transparent);
    opacity: 0.3;
  }
  .kn-kite-data-line:nth-child(1) { left: calc(50% - 90px); top: 30px; animation: dataLine 3s ease-in-out infinite 0s; }
  .kn-kite-data-line:nth-child(2) { left: calc(50% + 90px); top: 30px; animation: dataLine 3s ease-in-out infinite 0.5s; }
  .kn-kite-data-line:nth-child(3) { left: calc(50% - 60px); bottom: 30px; animation: dataLine 3s ease-in-out infinite 1s; }
  .kn-kite-data-line:nth-child(4) { left: calc(50% + 60px); bottom: 30px; animation: dataLine 3s ease-in-out infinite 1.5s; }
  @keyframes dataLine {
    0%, 100% { opacity: 0.1; transform: scaleY(0.5); }
    50% { opacity: 0.5; transform: scaleY(1); }
  }

  /* ── orbital satellite nodes ── */
  .kn-kite-satellite {
    position: absolute; width: 18px; height: 18px; border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, var(--green), var(--green-dim));
    box-shadow: 0 0 24px var(--green), 0 0 48px var(--green-glow);
    z-index: 2;
  }
  .kn-kite-sat-left  { left: -50px;  top: 50%; margin-top: -9px; }
  .kn-kite-sat-right { right: -50px; top: 50%; margin-top: -9px; }
  .kn-kite-sat-top   { top: -50px;   left: 50%; margin-left: -9px; }
  .kn-kite-sat-bot   { bottom: -50px; left: 50%; margin-left: -9px; }
  .kn-kite-satellite::after {
    content: ''; position: absolute; inset: 20%; border-radius: 50%;
    background: var(--white);
  }
  .kn-kite-sat-left::after  { animation: satFlash 4s ease-in-out infinite 0.0s; }
  .kn-kite-sat-right::after { animation: satFlash 4s ease-in-out infinite 1.0s; }
  .kn-kite-sat-top::after   { animation: satFlash 4s ease-in-out infinite 2.0s; }
  .kn-kite-sat-bot::after   { animation: satFlash 4s ease-in-out infinite 3.0s; }
  @keyframes satFlash {
    0%, 100% { transform: scale(1.2); opacity: 0.3; }
    50%      { transform: scale(0.6); opacity: 1; }
  }

  /* ── connector beams ── */
  .kn-kite-beam {
    position: absolute; background: linear-gradient(90deg, transparent, var(--green-border), transparent);
    opacity: 0.15; z-index: 1;
  }
  .kn-kite-beam-left  { left: -80px;  top: 50%; width: 120px; height: 1px; transform-origin: right center; }
  .kn-kite-beam-right { right: -80px; top: 50%; width: 120px; height: 1px; transform-origin: left center;  }
  .kn-kite-beam-top   { top: -80px;  left: 50%; width: 1px; height: 120px; transform-origin: center bottom; }
  .kn-kite-beam-bot   { bottom: -80px; left: 50%; width: 1px; height: 120px; transform-origin: center top;  }
  .kn-kite-beam-anim  { animation: beamPulse 3s ease-in-out infinite; }
  @keyframes beamPulse {
    0%, 100% { opacity: 0.05; }
    50%      { opacity: 0.35; }
  }

  /* ── floating particles ── */
  .kn-kite-particle {
    position: absolute; width: 4px; height: 4px; border-radius: 50%;
    background: var(--green); box-shadow: 0 0 8px var(--green);
    opacity: 0; z-index: 3;
  }
  .kn-kite-p-1  { top: 15%; left: 8%;  animation: particleDrift 6s ease-in-out infinite 0.0s; }
  .kn-kite-p-2  { top: 45%; left: 4%;  animation: particleDrift 6s ease-in-out infinite 0.8s; }
  .kn-kite-p-3  { top: 75%; left: 10%; animation: particleDrift 6s ease-in-out infinite 1.6s; }
  .kn-kite-p-4  { top: 25%; right: 6%; animation: particleDrift 6s ease-in-out infinite 2.4s; }
  .kn-kite-p-5  { top: 55%; right: 4%; animation: particleDrift 6s ease-in-out infinite 3.2s; }
  .kn-kite-p-6  { top: 85%; right: 8%; animation: particleDrift 6s ease-in-out infinite 4.0s; }
  .kn-kite-p-7  { top: 10%; left: 50%; animation: particleDrift 6s ease-in-out infinite 0.4s; }
  .kn-kite-p-8  { top: 90%; left: 50%; animation: particleDrift 6s ease-in-out infinite 1.2s; }
  .kn-kite-p-9  { top: 50%; left: 2%;  animation: particleDrift 6s ease-in-out infinite 2.0s; }
  .kn-kite-p-10 { top: 50%; right: 2%; animation: particleDrift 6s ease-in-out infinite 2.8s; }
  @keyframes particleDrift {
    0%, 100% { opacity: 0; transform: translateY(0) scale(0.5); }
    20%      { opacity: 0.7; }
    50%      { opacity: 0; transform: translateY(-60px) scale(1.2); }
    80%      { opacity: 0.3; }
  }

  /* ── side mini rings ── */
  .kn-kite-side-ring {
    position: absolute; width: 100px; height: 100px;
    border: 1px solid var(--green-border); border-radius: 50%;
    opacity: 0.1; z-index: 1;
  }
  .kn-kite-side-ring-left  { left: -70px;  top: 40%; animation: sideRingSpin 10s linear infinite; }
  .kn-kite-side-ring-right { right: -70px; top: 60%; animation: sideRingSpin 10s linear infinite reverse; }
  @keyframes sideRingSpin {
    0%   { transform: rotate(0deg) scale(1);   opacity: 0.08; border-color: var(--green-border); }
    50%  { transform: rotate(180deg) scale(1.3); opacity: 0.25; border-color: var(--green); }
    100% { transform: rotate(360deg) scale(1);  opacity: 0.08; border-color: var(--green-border); }
  }

  .kn-hero-center-label {
    position: absolute; bottom: 24px; left: 0; right: 0;
    display: flex; align-items: center; justify-content: center;
    gap: 8px; color: var(--muted); font-size: 0.75rem; letter-spacing: 0.15em;
    text-transform: uppercase;
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  .kn-scroll-indicator {
    position: absolute; bottom: 24px; right: 24px;
    text-align: right;
  }
  .kn-scroll-indicator span {
    display: block; font-size: 0.7rem; letter-spacing: 0.15em;
    text-transform: uppercase; color: var(--muted);
  }
  .kn-scroll-line {
    width: 2px; height: 40px; background: var(--green);
    margin: 8px 0 0 auto;
    animation: scrollLine 1.5s ease-in-out infinite;
  }
  @keyframes scrollLine { 0%{transform:scaleY(0);transform-origin:top} 50%{transform:scaleY(1);transform-origin:top} 51%{transform-origin:bottom} 100%{transform:scaleY(0);transform-origin:bottom} }

  .kn-hero-right {
    border-left: 1px solid var(--green-border);
    padding: 48px 32px;
    display: flex; flex-direction: column; justify-content: space-between;
  }
  .kn-clock { font-family: var(--font-mono); }
  .kn-clock-time { font-size: 2.2rem; font-weight: 700; color: var(--text); }
  .kn-clock-date { font-size: 0.78rem; color: var(--muted); margin-top: 4px; }
  .kn-hero-bottom-left {
    display: flex; flex-direction: column; gap: 12px;
  }
  .kn-tag { display: inline-block; font-size: 0.7rem; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--green); font-weight: 700; }
  .kn-hero-cta-group { display: flex; flex-direction: column; gap: 10px; margin-top: 8px; }
  .kn-btn-primary {
    display: flex; align-items: center; justify-content: space-between;
    background: var(--green); color: #000;
    border: none; padding: 12px 20px; cursor: pointer;
    font-family: var(--font-display); font-weight: 900;
    font-size: 0.82rem; letter-spacing: 0.06em; text-transform: uppercase;
    text-decoration: none; transition: background 0.2s;
  }
  .kn-btn-primary:hover { background: #00ff99; }
  .kn-btn-outline {
    display: flex; align-items: center; justify-content: space-between;
    background: transparent; color: var(--text);
    border: 1px solid var(--green-border); padding: 12px 20px; cursor: pointer;
    font-family: var(--font-display); font-weight: 700;
    font-size: 0.82rem; letter-spacing: 0.06em; text-transform: uppercase;
    text-decoration: none; transition: border-color 0.2s, color 0.2s;
  }
  .kn-btn-outline:hover { border-color: var(--green); color: var(--green); }

  .kn-hero-stats {
    display: flex; flex-direction: column; gap: 16px;
  }
  .kn-stat-item { border-top: 1px solid var(--green-border); padding-top: 12px; }
  .kn-stat-num { font-size: 1.8rem; font-weight: 900; color: var(--green); line-height: 1; }
  .kn-stat-label { font-size: 0.7rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px; }

  /* ── FEATURES ROWS ── */
  .kn-features { border: 1px solid var(--green-border); margin: 0 32px; border-radius: 24px; overflow: hidden; }
  .kn-feature-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-bottom: 1px solid var(--green-border);
    min-height: 120px;
    transition: background 0.3s;
    cursor: default;
  }
  .kn-feature-row:hover .kn-feature-left { background: var(--surface3); }
  .kn-feature-left {
    display: flex; align-items: center; gap: 40px;
    padding: 32px 48px;
    border-right: 1px solid var(--green-border);
    transition: background 0.3s;
  }
  .kn-feature-num {
    font-size: 0.75rem; color: var(--muted); font-family: var(--font-mono);
    min-width: 28px;
  }
  .kn-feature-title {
    font-size: clamp(1.4rem, 3vw, 2.2rem);
    font-weight: 900; text-transform: uppercase; letter-spacing: -0.01em;
    line-height: 1.1;
  }
  .kn-feature-right {
    padding: 32px 48px;
    display: flex; align-items: center;
    background: var(--surface2);
  }
  .kn-feature-desc { font-size: 0.88rem; line-height: 1.7; color: var(--muted); max-width: 420px; }
  /* colored rows */
  .kn-feature-row.c1 .kn-feature-left { background: #001a0a; }
  .kn-feature-row.c1 .kn-feature-title { color: var(--green); }
  .kn-feature-row.c2 .kn-feature-left { background: #001520; }
  .kn-feature-row.c2 .kn-feature-title { color: #00c8ff; }
  .kn-feature-row.c3 .kn-feature-left { background: #1a0030; }
  .kn-feature-row.c3 .kn-feature-title { color: #cc88ff; }
  .kn-feature-row.c4 .kn-feature-left { background: #0f1800; }
  .kn-feature-row.c4 .kn-feature-title { color: #aaff00; }

  /* ── TRUSTED MARQUEE ── */
  .kn-trusted {
    padding: 80px 0 0;
    border: 1px solid var(--green-border);
    margin: 0 32px;
    border-radius: 24px;
    overflow: hidden;
  }
  .kn-trusted-header {
    display: grid; grid-template-columns: auto 1fr auto;
    align-items: start; gap: 40px;
    padding: 0 64px 64px;
  }
  .kn-arrow-icon { color: var(--green); font-size: 2.5rem; font-weight: 900; line-height: 1; }
  .kn-trusted-headline {
    font-size: clamp(2rem, 4vw, 3.2rem);
    font-weight: 900; text-transform: uppercase; line-height: 1.1;
  }
  .kn-trusted-sub { font-size: 0.88rem; line-height: 1.7; color: var(--muted); max-width: 300px; }
  .kn-marquee-wrap { overflow: hidden; border-top: 1px solid var(--green-border); }
  .kn-marquee {
    display: flex; gap: 0;
    animation: marquee 18s linear infinite;
    white-space: nowrap;
  }
  @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  .kn-marquee-item {
    flex-shrink: 0; padding: 28px 48px;
    border-right: 1px solid var(--green-border);
    font-weight: 900; font-size: 1rem; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--muted);
    transition: color 0.2s;
  }
  .kn-marquee-item:hover { color: var(--green); }

  /* ── BUILD CTA SECTION ── */
  .kn-build {
    padding: 80px 64px;
    border: 1px solid var(--green-border);
    margin: 0 32px;
    border-radius: 24px;
    overflow: hidden;
  }
  .kn-build-header {
    display: grid; grid-template-columns: auto 1fr;
    align-items: start; gap: 32px; margin-bottom: 48px;
  }
  .kn-build-headline {
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 900; text-transform: uppercase; line-height: 1.1;
  }
  .kn-build-cards {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 0;
    border: 1px solid var(--green-border);
  }
  .kn-build-card {
    padding: 32px; border-right: 1px solid var(--green-border);
    position: relative; overflow: hidden;
    text-decoration: none; color: var(--text);
    transition: background 0.3s;
    min-height: 180px; display: flex; flex-direction: column; justify-content: flex-end;
  }
  .kn-build-card:last-child { border-right: none; }
  .kn-build-card:hover { background: var(--surface3); }
  .kn-build-card-bg {
    position: absolute; inset: 0;
    background: linear-gradient(135deg, var(--green-glow), transparent 60%);
    opacity: 0; transition: opacity 0.3s;
  }
  .kn-build-card:hover .kn-build-card-bg { opacity: 1; }
  .kn-build-card-label {
    font-size: 0.7rem; color: var(--muted); text-transform: uppercase;
    letter-spacing: 0.12em; margin-bottom: 8px;
  }
  .kn-build-card-title {
    font-size: 1.1rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.04em;
    color: var(--text);
  }

  /* ── AI SHOWCASE ── */
  .kn-ai {
    padding: 80px 64px;
    border: 1px solid var(--green-border);
    margin: 0 32px;
    border-radius: 24px;
    overflow: hidden;
    display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center;
  }
  .kn-section-tag { font-size: 0.7rem; color: var(--green); text-transform: uppercase;
    letter-spacing: 0.15em; font-weight: 700; margin-bottom: 16px; }
  .kn-section-title {
    font-size: clamp(2rem, 3vw, 2.8rem);
    font-weight: 900; text-transform: uppercase; line-height: 1.1;
    margin-bottom: 16px;
  }
  .kn-section-desc { font-size: 0.9rem; line-height: 1.7; color: var(--muted); }
  .kn-chat-demo {
    background: var(--surface); border: 1px solid var(--green-border);
    padding: 24px; display: flex; flex-direction: column; gap: 16px;
    font-family: var(--font-mono);
  }
  .kn-chat-header {
    display: flex; align-items: center; gap: 8px;
    font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted);
    padding-bottom: 16px; border-bottom: 1px solid var(--green-border);
  }
  .kn-chat-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green);
    box-shadow: 0 0 8px var(--green); animation: pulse 1.5s infinite; }
  .kn-msg { padding: 12px 16px; font-size: 0.8rem; line-height: 1.5; }
  .kn-msg.user { background: var(--surface2); color: var(--text); align-self: flex-end; max-width: 80%; }
  .kn-msg.ai { background: rgba(0,255,136,0.07); color: var(--green); border-left: 2px solid var(--green); }
  .kn-msg-label { font-size: 0.65rem; color: var(--muted); margin-bottom: 4px; }
  .kn-ai-metrics { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 8px; }
  .kn-ai-metric { background: var(--surface2); padding: 6px 12px; font-size: 0.7rem;
    color: var(--green); border: 1px solid var(--green-border); }

  /* ── ARBITRAGE ── */
  .kn-arb {
    padding: 80px 64px;
    border: 1px solid var(--green-border);
    margin: 0 32px;
    border-radius: 24px;
    overflow: hidden;
  }
  .kn-arb-header { margin-bottom: 40px; }
  .kn-arb-table {
    width: 100%; border-collapse: collapse;
    font-family: var(--font-mono); font-size: 0.82rem;
  }
  .kn-arb-table th {
    text-align: left; padding: 12px 16px;
    border-bottom: 1px solid var(--green-border);
    color: var(--muted); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em;
  }
  .kn-arb-table td { padding: 14px 16px; border-bottom: 1px solid rgba(0,255,136,0.08); }
  .kn-arb-table tr:hover td { background: var(--surface2); }
  .kn-edge-badge {
    display: inline-block; background: rgba(0,255,136,0.12);
    color: var(--green); border: 1px solid var(--green-border);
    padding: 3px 10px; font-size: 0.72rem; font-weight: 700;
    animation: glowPulse 2s ease-in-out infinite;
  }
  @keyframes glowPulse {
    0%,100%{box-shadow:0 0 4px rgba(0,255,136,0.2)}
    50%{box-shadow:0 0 12px rgba(0,255,136,0.5)}
  }

  /* ── NEWS SECTION ── */
  .kn-news { padding: 80px 64px; border: 1px solid var(--green-border); margin: 0 32px; border-radius: 24px; overflow: hidden; }
  .kn-news-header {
    display: flex; justify-content: space-between; align-items: flex-end;
    margin-bottom: 48px; padding-bottom: 24px; border-bottom: 1px solid var(--green-border);
  }
  .kn-news-headline {
    font-size: clamp(2rem, 4vw, 3rem); font-weight: 900; text-transform: uppercase; line-height: 1.1;
  }
  .kn-news-icon { font-size: 3rem; color: var(--green); font-weight: 900; }
  .kn-news-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 0; border: 1px solid var(--green-border); }
  .kn-news-featured {
    padding: 32px; border-right: 1px solid var(--green-border);
  }
  .kn-news-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
  .kn-news-tag {
    background: var(--green); color: #000; padding: 4px 12px;
    font-size: 0.7rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em;
  }
  .kn-news-tag.outline {
    background: transparent; color: var(--text); border: 1px solid var(--green-border);
  }
  .kn-news-ftitle { font-size: 1.8rem; font-weight: 900; line-height: 1.2; margin-bottom: 12px; }
  .kn-news-meta { font-size: 0.72rem; color: var(--muted); font-family: var(--font-mono); }
  .kn-news-side-item {
    padding: 24px; border-bottom: 1px solid var(--green-border);
    display: flex; flex-direction: column; gap: 8px;
    border-right: 1px solid var(--green-border);
  }
  .kn-news-side-item:last-child { border-right: none; }
  .kn-news-stitle { font-size: 0.95rem; font-weight: 700; line-height: 1.3; }

  /* ── FINAL CTA ── */
  .kn-final-cta {
    padding: 120px 64px;
    text-align: center;
    border: 1px solid var(--green-border);
    position: relative; overflow: hidden;
  }
  .kn-final-cta-bg {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at center, rgba(0,255,136,0.06) 0%, transparent 70%);
  }
  .kn-final-title {
    font-size: clamp(2.5rem, 5vw, 4.5rem);
    font-weight: 900; text-transform: uppercase; line-height: 1.05;
    max-width: 900px; margin: 0 auto 40px; position: relative;
  }
  .kn-final-title span { color: var(--green); }
  .kn-final-btns { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; position: relative; }

  /* ── FOOTER ── */
  .kn-footer { background: var(--black); }
  .kn-footer-links {
    display: grid; grid-template-columns: repeat(4, 1fr);
    border-top: 1px solid var(--green-border);
    padding: 64px;
    gap: 48px;
  }
  .kn-footer-col-title {
    font-size: 0.75rem; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--muted); margin-bottom: 20px;
  }
  .kn-footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 10px; }
  .kn-footer-col ul li a {
    color: var(--text); text-decoration: none; font-size: 0.85rem;
    display: flex; align-items: center; gap: 6px; opacity: 0.7; transition: opacity 0.2s, color 0.2s;
  }
  .kn-footer-col ul li a:hover { opacity: 1; color: var(--green); }
  .kn-footer-col ul li a .arr { font-size: 0.75rem; opacity: 0; transition: opacity 0.2s; }
  .kn-footer-col ul li a:hover .arr { opacity: 1; }
  .kn-footer-wordmark {
    padding: 0;
    overflow: hidden;
    position: relative;
  }
  .kn-footer-wordmark::before, .kn-footer-wordmark::after {
    content: ''; position: absolute; top: 0; bottom: 0; width: 120px; z-index: 2;
    pointer-events: none;
  }
  .kn-footer-wordmark::before { left: 0; background: linear-gradient(to right, var(--black), transparent); }
  .kn-footer-wordmark::after { right: 0; background: linear-gradient(to left, var(--black), transparent); }
  .kn-footer-big {
    font-size: clamp(80px, 15vw, 200px);
    font-weight: 900; text-transform: lowercase; line-height: 0.85;
    color: var(--text); letter-spacing: -0.02em;
    white-space: nowrap; user-select: none;
    display: flex;
    animation: kinesisScroll 4s linear infinite;
  }
  @keyframes kinesisScroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .kn-footer-bottom {
    display: flex; justify-content: space-between; align-items: center;
    padding: 24px 64px;
    font-size: 0.75rem; color: var(--muted);
  }
  .kn-footer-bottom a { color: var(--green); text-decoration: none; }

  /* ── SCROLL REVEAL ── */
  .kn-reveal {
    opacity: 0;
    transform: translateY(40px);
    transition: opacity 0.7s cubic-bezier(.4,0,.2,1), transform 0.7s cubic-bezier(.4,0,.2,1);
  }
  .kn-reveal.kn-revealed {
    opacity: 1;
    transform: translateY(0);
  }
  .kn-reveal-left {
    opacity: 0;
    transform: translateX(-40px);
    transition: opacity 0.7s cubic-bezier(.4,0,.2,1), transform 0.7s cubic-bezier(.4,0,.2,1);
  }
  .kn-reveal-left.kn-revealed {
    opacity: 1;
    transform: translateX(0);
  }
  .kn-reveal-right {
    opacity: 0;
    transform: translateX(40px);
    transition: opacity 0.7s cubic-bezier(.4,0,.2,1), transform 0.7s cubic-bezier(.4,0,.2,1);
  }
  .kn-reveal-right.kn-revealed {
    opacity: 1;
    transform: translateX(0);
  }
  .kn-reveal-scale {
    opacity: 0;
    transform: scale(0.9);
    transition: opacity 0.7s cubic-bezier(.4,0,.2,1), transform 0.7s cubic-bezier(.4,0,.2,1);
  }
  .kn-reveal-scale.kn-revealed {
    opacity: 1;
    transform: scale(1);
  }

  /* ── LOADER ── */
  .kn-loader {
    position: fixed; inset: 0; z-index: 9999;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: var(--black);
    transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1);
  }
  .kn-loader.hidden {
    opacity: 0;
    transform: translateY(-100%);
    pointer-events: none;
  }
  .kn-loader-logo {
    width: 124px; height: 124px;
    margin-bottom: 24px;
    animation: loaderPulse 1s ease-in-out infinite;
  }
  @keyframes loaderPulse {
    0%, 100% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.1); opacity: 1; }
  }
  .kn-loader-text {
    font-family: var(--font-display); font-weight: 900;
    font-size: 1.4rem; letter-spacing: 0.15em; text-transform: uppercase;
    color: var(--text);
  }
  .kn-loader-bar {
    width: 120px; height: 2px;
    background: var(--surface3);
    margin-top: 24px;
    border-radius: 1px;
    overflow: hidden;
  }
  .kn-loader-bar::after {
    content: ''; display: block;
    width: 40%; height: 100%;
    background: var(--green);
    border-radius: 1px;
    animation: loaderBar 1.2s ease-in-out infinite;
  }
  @keyframes loaderBar {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(350%); }
  }

  /* ── AVALANCHE-STYLE ENTRANCE ── */
  .avax-box {
    opacity: 0;
    transform: scale(0.95) translateY(40px);
    transition: opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1);
  }
  .avax-box.avax-loaded {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  .avax-delay-1 { transition-delay: 150ms; }
  .avax-delay-2 { transition-delay: 300ms; }

  /* ── ROUNDED CORNERS ── */
  .kn-build-cards { border-radius: 16px; overflow: hidden; }
  .kn-chat-demo { border-radius: 12px; }
  .kn-msg { border-radius: 8px; }
  .kn-msg.user { border-radius: 12px 12px 4px 12px; }
  .kn-msg.ai { border-radius: 4px 12px 12px 12px; }
  .kn-news-grid { border-radius: 16px; overflow: hidden; }
  .kn-hero-preview { border-radius: 12px !important; }
  .kn-final-cta { border-radius: 24px; margin: 0 32px; }

  /* ── YELLOW ACCENTS ── */
  .kn-yellow-text { color: var(--yellow) !important; }
  .kn-yellow-badge {
    color: var(--yellow) !important;
    border-color: var(--yellow-border) !important;
    background: rgba(255,215,0,0.12) !important;
  }
  .kn-yellow-bg {
    background: var(--yellow) !important;
    color: #000 !important;
    border-color: var(--yellow) !important;
  }

  /* ── WHY KINESIS ── */
  .kn-why {
    padding: 100px 64px;
    border: 1px solid var(--yellow-border);
    margin: 0 32px;
    border-radius: 24px;
    background: linear-gradient(180deg, var(--black) 0%, rgba(255,215,0,0.02) 50%, var(--black) 100%);
    position: relative;
    overflow: hidden;
  }
  .kn-why-bg {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 30% 50%, rgba(255,215,0,0.05) 0%, transparent 60%);
    pointer-events: none;
  }
  .kn-why-header { text-align: center; margin-bottom: 64px; }
  .kn-why-tag {
    display: inline-block;
    background: var(--yellow); color: #000;
    padding: 6px 20px;
    font-size: 0.7rem; font-weight: 900; letter-spacing: 0.12em;
    text-transform: uppercase; border-radius: 4px;
    margin-bottom: 20px;
  }
  .kn-why-title {
    font-size: clamp(2rem, 4vw, 3.2rem);
    font-weight: 900; text-transform: uppercase; line-height: 1.1;
    color: var(--text);
  }
  .kn-why-title span { color: var(--yellow); }
  .kn-why-sub {
    font-size: 0.9rem; color: var(--muted); max-width: 500px;
    margin: 16px auto 0; line-height: 1.7;
  }
  .kn-why-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px; max-width: 1100px; margin: 0 auto;
  }
  .kn-why-card {
    background: var(--surface);
    border: 1px solid var(--yellow-border);
    border-radius: 16px;
    padding: 36px 28px;
    text-align: center;
    transition: transform 0.3s, box-shadow 0.3s, background 0.3s;
    position: relative; overflow: hidden;
  }
  .kn-why-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 40px rgba(255,215,0,0.08);
    background: var(--surface2);
  }
  .kn-why-card-icon {
    width: 56px; height: 56px;
    margin: 0 auto 20px;
    border-radius: 14px;
    background: rgba(255,215,0,0.1);
    border: 1px solid var(--yellow-border);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.5rem; color: var(--yellow);
  }
  .kn-why-card-title {
    font-size: 1rem; font-weight: 900; text-transform: uppercase;
    letter-spacing: 0.04em; margin-bottom: 10px;
  }
  .kn-why-card-desc {
    font-size: 0.82rem; line-height: 1.6; color: var(--muted);
  }

  @media (max-width: 900px) {
    .kn-hero { grid-template-columns: 1fr; grid-template-rows: auto; margin: 0 16px; border-radius: 16px; }
    .kn-hero-left, .kn-hero-right { border: none; border-bottom: 1px solid var(--green-border); }
    .kn-features { margin: 0 16px; border-radius: 16px; }
    .kn-feature-row { grid-template-columns: 1fr; }
    .kn-feature-right { display: none; }
    .kn-trusted { margin: 0 16px; border-radius: 16px; }
    .kn-build { margin: 0 16px; border-radius: 16px; padding: 48px 24px; }
    .kn-ai { grid-template-columns: 1fr; margin: 0 16px; border-radius: 16px; padding: 48px 24px; }
    .kn-news-grid { grid-template-columns: 1fr; }
    .kn-footer-links { grid-template-columns: repeat(2, 1fr); padding: 32px; }
    .kn-footer-wordmark { padding: 24px 32px 0; }
    .kn-footer-bottom { padding: 24px 32px; }
    .kn-build-cards { grid-template-columns: 1fr; }
    .kn-build-card { border-right: none; border-bottom: 1px solid var(--green-border); }
    .kn-arb { padding: 48px 24px; margin: 0 16px; border-radius: 16px; }
    .kn-news { padding: 48px 24px; margin: 0 16px; border-radius: 16px; }
    .kn-why { padding: 60px 24px; margin: 0 16px; border-radius: 16px; }
    .kn-why-grid { grid-template-columns: 1fr; gap: 16px; }
    .kn-final-cta { margin: 0 16px; border-radius: 16px; }
    .kn-nav { padding: 0 20px; }
    .kn-nav-links { display: none; }
  }
`;

/* ─── CLOCK ─────────────────────────────────────────────────────────────── */
function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const fmt = (n) => String(n).padStart(2, "0");
  const h = time.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  const timeStr = `${h12}:${fmt(time.getMinutes())} ${ampm}`;
  const dateStr = time.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  return (
    <div className="kn-clock">
      <div className="kn-clock-time">{timeStr}</div>
      <div className="kn-clock-date">{dateStr}</div>
    </div>
  );
}

/* ─── LIVE TICKER ─────────────────────────────────────────────────────────── */
const tickerData = [
  { market: "Arsenal vs Chelsea", odds: "1.87", dir: "up" },
  { market: "BTC/USD Closes 110k", odds: "2.45", dir: "down" },
  { market: "Fed Rate Cut Q3", odds: "3.10", dir: "up" },
  { market: "IPL Finals — MI", odds: "1.55", dir: "up" },
  { market: "ETH/BTC Ratio 0.05", odds: "4.20", dir: "down" },
  { market: "Arsenal vs Chelsea", odds: "1.87", dir: "up" },
  { market: "BTC/USD Closes 110k", odds: "2.45", dir: "down" },
  { market: "Fed Rate Cut Q3", odds: "3.10", dir: "up" },
];

function LiveTicker() {
  return (
    <>
      <div className="kn-hero-preview-title">LIVE MARKETS</div>
      <div className="kn-hero-preview">
        <div className="kn-ticker">
          {tickerData.map((d, i) => (
            <div className="kn-ticker-line" key={i}>
              <span>{d.market}</span>
              <span className={d.dir}>{d.dir === "up" ? "↑" : "↓"} {d.odds}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ─── SCROLL REVEAL HOOK ───────────────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('kn-revealed');
          }
        });
      },
      { threshold: 0.12 }
    );
    const els = document.querySelectorAll('.kn-reveal, .kn-reveal-left, .kn-reveal-right, .kn-reveal-scale');
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ─── MAIN ─────────────────────────────────────────────────────────────── */
export default function Landing() {
  const [theme, setTheme] = useState("dark");
  const [loading, setLoading] = useState(true);
  const rootRef = useRef(null);
  useScrollReveal();

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(t);
  }, []);

  const arbRows = [
    { market: "Arsenal vs Chelsea — Win", agon: "1.87", betfair: "1.72", edge: "+8.7%", profit: "$87" },
    { market: "BTC Closes Above $110k", agon: "2.45", betfair: "2.20", edge: "+11.4%", profit: "$114" },
    { market: "Fed Rate Cut — Sep 2025", agon: "3.10", betfair: "2.85", edge: "+8.8%", profit: "$88" },
    { market: "IPL Finals — MI Win", agon: "1.55", betfair: "1.42", edge: "+9.2%", profit: "$92" },
  ];

  return (
    <>
      <style>{css}</style>

      {/* LOADER */}
      <div className={`kn-loader${loading ? '' : ' hidden'}`}>
        <img className="kn-loader-logo" src="/logo-kinesis.png" alt="Kinesis" />
        <div className="kn-loader-text">Kinesis</div>
        <div className="kn-loader-bar" />
      </div>

      <div data-theme={theme} ref={rootRef} style={{ opacity: loading ? 0 : 1, transition: 'opacity 0.4s ease' }}>

        {/* NAV */}
        <nav className="kn-nav">
          <a href="/login" className="kn-nav-brand">
            <img className="kn-logo-mark" src="/logo-kinesis.png" alt="Kinesis" />
            Kinesis
          </a>
          <ul className="kn-nav-links">
          {["About", "Agon", "Agentex", "Arbitrage", "Builder"].map(l => (
            <li key={l}>
              <a href={l === "About" ? "/about" : "/login"}>{l}</a>
            </li>
          ))}
        </ul>
          <div className="kn-nav-actions">
            <button className="kn-theme-toggle" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>
              <span className="kn-toggle-icon moon">☾</span>
              <span className="kn-toggle-icon sun">☀</span>
            </button>
            <Link to="/login" className="kn-nav-cta">Launch →</Link>
          </div>
        </nav>

        {/* HERO */}
        <section className="kn-hero">
          <div className={`kn-hero-left avax-box${!loading ? ' avax-loaded' : ''}`}>
            <p>
              Kinesis powers a AI-native global ecosystem of prediction traders, autonomous betting agents, and quant analysts operating in real-time across every market vertical.
            </p>
            <div>
              <LiveTicker />
              <div style={{ marginTop: 24 }}>
                <div className="kn-tag">Powered by Kinesis</div>
                <p style={{ fontSize: "0.82rem", marginTop: 8, opacity: 0.7, lineHeight: 1.6 }}>
                  The future of prediction markets won't happen on one platform — it'll happen across a unified AI trading ecosystem.
                </p>
                <Link to="/login" className="kn-btn-outline" style={{ marginTop: 16, maxWidth: 200 }}>
                  Explore Markets →
                </Link>
              </div>
            </div>
          </div>

          <div className={`kn-hero-center avax-box avax-delay-1${!loading ? ' avax-loaded' : ''}`}>
            <div className="kn-hero-bg-grid" />
            <div className="kn-hero-geo">
              <div className="kn-kite-container">
                <div className="kn-kite-data-line" />
                <div className="kn-kite-data-line" />
                <div className="kn-kite-data-line" />
                <div className="kn-kite-data-line" />
                {/* side decor */}
                <div className="kn-kite-side-ring kn-kite-side-ring-left" />
                <div className="kn-kite-side-ring kn-kite-side-ring-right" />
                {/* connector beams */}
                <div className="kn-kite-beam kn-kite-beam-left kn-kite-beam-anim" />
                <div className="kn-kite-beam kn-kite-beam-right kn-kite-beam-anim" />
                <div className="kn-kite-beam kn-kite-beam-top kn-kite-beam-anim" />
                <div className="kn-kite-beam kn-kite-beam-bot kn-kite-beam-anim" />
                {/* satellite nodes */}
                <div className="kn-kite-satellite kn-kite-sat-left" />
                <div className="kn-kite-satellite kn-kite-sat-right" />
                <div className="kn-kite-satellite kn-kite-sat-top" />
                <div className="kn-kite-satellite kn-kite-sat-bot" />
                {/* floating particles */}
                <div className="kn-kite-particle kn-kite-p-1" />
                <div className="kn-kite-particle kn-kite-p-2" />
                <div className="kn-kite-particle kn-kite-p-3" />
                <div className="kn-kite-particle kn-kite-p-4" />
                <div className="kn-kite-particle kn-kite-p-5" />
                <div className="kn-kite-particle kn-kite-p-6" />
                <div className="kn-kite-particle kn-kite-p-7" />
                <div className="kn-kite-particle kn-kite-p-8" />
                <div className="kn-kite-particle kn-kite-p-9" />
                <div className="kn-kite-particle kn-kite-p-10" />
                {/* core kite */}
                <div className="kn-kite-ring" />
                <div className="kn-kite-frame" />
                <div className="kn-kite-core" />
                <div className="kn-kite-tail" />
              </div>
            </div>
            <div className="kn-hero-center-label">
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 8px var(--green)" }} />
              Market Engine Active
            </div>
            <div className="kn-scroll-indicator">
              <span>SCROLL</span>
              <span style={{ fontSize: "0.65rem", opacity: 0.6 }}>to explore page</span>
              <div className="kn-scroll-line" />
            </div>
          </div>

          <div className={`kn-hero-right avax-box avax-delay-2${!loading ? ' avax-loaded' : ''}`}>
            <Clock />
            <div className="kn-hero-stats">
              <div className="kn-stat-item">
                <div className="kn-stat-num">$2.4B</div>
                <div className="kn-stat-label">Total Volume Traded</div>
              </div>
              <div className="kn-stat-item">
                <div className="kn-stat-num">47K+</div>
                <div className="kn-stat-label">Active Traders</div>
              </div>
              <div className="kn-stat-item">
                <div className="kn-stat-num">98.4%</div>
                <div className="kn-stat-label">Uptime</div>
              </div>
            </div>
            <div className="kn-hero-cta-group">
              <Link to="/login" className="kn-btn-primary">Start Trading →</Link>
              <a href="/login" className="kn-btn-outline">Connect Wallet →</a>
            </div>
          </div>
        </section>

        {/* FEATURES NUMBERED ROWS */}
        <section className="kn-features">
          {[
            { num: "01", title: "AI-NATIVE. AUTONOMOUS. LIVE.", desc: "Every market, every bet, every trade runs through a real-time AI layer that processes signals, detects edge, and executes with sub-second precision.", cls: "c1" },
            { num: "02", title: "INFINITELY SCALABLE PREDICTION MARKETS", desc: "Create binary, multi-outcome, and live markets in seconds. The Agon exchange supports thousands of concurrent orderbooks with institutional-grade infrastructure.", cls: "c2" },
            { num: "03", title: "AUTONOMOUS AGENT TRADING", desc: "Deploy AI bots that monitor markets, execute strategies, and compound returns 24/7. Configure risk parameters, set targets, and let Agentex do the rest.", cls: "c3" },
            { num: "04", title: "REAL-TIME ARBITRAGE INTELLIGENCE", desc: "Kinesis scans across multiple platforms simultaneously, surfaces guaranteed-edge opportunities, and alerts you to profitable discrepancies before they close.", cls: "c4" },
          ].map(f => (
            <div className={`kn-feature-row ${f.cls} kn-reveal`} key={f.num}>
              <div className="kn-feature-left">
                <span className="kn-feature-num">{f.num}</span>
                <h2 className="kn-feature-title">{f.title}</h2>
              </div>
              <div className="kn-feature-right">
                <p className="kn-feature-desc">{f.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* TRUSTED / MARQUEE */}
        <section className="kn-trusted">
          <div className="kn-trusted-header kn-reveal">
            <div className="kn-arrow-icon">{">>"}</div>
            <h2 className="kn-trusted-headline">
              KINESIS IS TRUSTED BY<br />TRADERS WORLDWIDE
            </h2>
            <p className="kn-trusted-sub">
              Professional quants, institutional funds, and crypto-native traders choose Kinesis for its AI-grade precision and real-time execution.
            </p>
          </div>
          <div className="kn-marquee-wrap">
            <div className="kn-marquee">
              {["POLYMARKET", "HYPERLIQUID", "BETFAIR", "DEXALOT", "UNISWAP", "CHAINLINK", "1INCH", "AAVE",
                "POLYMARKET", "HYPERLIQUID", "BETFAIR", "DEXALOT", "UNISWAP", "CHAINLINK", "1INCH", "AAVE"].map((n, i) => (
                <div className="kn-marquee-item" key={i}>{n}</div>
              ))}
            </div>
          </div>
        </section>

        {/* BUILD ON KINESIS */}
        <section className="kn-build">
          <div className="kn-build-header kn-reveal">
            <div className="kn-arrow-icon" style={{ fontSize: "3rem" }}>⊕</div>
            <h2 className="kn-build-headline">
              BUILD ON THE PLATFORM<br />DESIGNED FOR PREDICTION INTELLIGENCE
            </h2>
          </div>
          <div className="kn-build-cards">
            {[
              { label: "Exchange", title: "AGON MARKETS", desc: "Trade binary and multi-outcome markets with live orderbooks" },
              { label: "AI Layer", title: "AGENTEX BOTS", desc: "Deploy autonomous trading agents with custom risk profiles" },
              { label: "Scanner", title: "ARB INTELLIGENCE", desc: "Real-time edge detection across platforms" },
            ].map(c => (
              <a href="/login" className="kn-build-card kn-reveal-scale" key={c.title}>
                <div className="kn-build-card-bg" />
                <div className="kn-build-card-label">{c.label}</div>
                <div className="kn-build-card-title">{c.title}</div>
              </a>
            ))}
          </div>
        </section>

        {/* AI ASSISTANT SHOWCASE */}
        <section className="kn-ai">
          <div className="kn-reveal-left">
            <div className="kn-section-tag">Agentex — AI Layer</div>
            <h2 className="kn-section-title">YOUR AI COPILOT FOR PREDICTION MARKETS</h2>
            <p className="kn-section-desc">
              Ask anything. Get institutional-grade analysis in seconds. Agentex processes live odds, historical patterns, and real-time signals to surface actionable edges before the market moves.
            </p>
            <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
              <Link to="/login" className="kn-btn-primary" style={{ maxWidth: 220 }}>Try Agentex →</Link>
              <a href="/login" className="kn-btn-outline" style={{ maxWidth: 220 }}>View Demo →</a>
            </div>
          </div>
          <div className="kn-chat-demo kn-reveal-right">
            <div className="kn-chat-header">
              <div className="kn-chat-dot" />
              Agentex AI — Live Analysis
            </div>
            <div className="kn-msg user">
              <div className="kn-msg-label">YOU</div>
              Analyze Arsenal vs Chelsea — recommend a trade
            </div>
            <div className="kn-msg ai">
              <div className="kn-msg-label">AGENTEX</div>
              Arsenal — Win @ 1.87 has a +9.3% edge over true probability. Recent form: 4W-1D-0L. Chelsea injury: Reece James (out). Suggested stake: 3.2% of bankroll.
              <div className="kn-ai-metrics">
                <span className="kn-ai-metric">Confidence 84%</span>
                <span className="kn-ai-metric">Edge +9.3%</span>
                <span className="kn-ai-metric">Risk LOW</span>
              </div>
            </div>
          </div>
        </section>

        {/* ARBITRAGE SCANNER */}
        <section className="kn-arb">
          <div className="kn-arb-header">
            <div className="kn-section-tag">Arbitrage Scanner</div>
            <h2 className="kn-section-title">GUARANTEED EDGE. REAL-TIME.</h2>
          </div>
          <table className="kn-arb-table kn-reveal">
            <thead>
              <tr>
                <th>Market</th>
                <th>Agon Odds</th>
                <th>Betfair Odds</th>
                <th>Edge %</th>
                <th>Est. Profit</th>
              </tr>
            </thead>
            <tbody>
              {arbRows.map((r, i) => (
                <tr key={i}>
                  <td>{r.market}</td>
                  <td style={{ color: "var(--green)" }}>{r.agon}</td>
                  <td style={{ color: "var(--muted)" }}>{r.betfair}</td>
                  <td><span className="kn-edge-badge kn-yellow-badge">{r.edge}</span></td>
                  <td style={{ color: "var(--green)", fontWeight: 700 }}>{r.profit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* NEWS */}
        <section className="kn-news">
          <div className="kn-news-header kn-reveal">
            <h2 className="kn-news-headline">
              INTELLIGENCE &amp; INSIGHTS<br />FROM THE KINESIS NETWORK
            </h2>
            <div className="kn-news-icon">⊗</div>
          </div>
          <div className="kn-news-grid kn-reveal">
            <div className="kn-news-featured">
              <div className="kn-news-tags">
                <span className="kn-news-tag">AI Markets</span>
                <span className="kn-news-tag outline">Research</span>
              </div>
              <h3 className="kn-news-ftitle">AI-Generated Prediction Markets: The New Revenue Layer for Quant Funds</h3>
              <p className="kn-news-meta">May 21, 2026 / By Kinesis Research / 8 Min Read</p>
            </div>
            {[
              { tag: "Arbitrage", title: "How Edge Detection Algorithms Are Reshaping Sports Betting" },
              { tag: "Agents", title: "Autonomous Trading Bots: ROI Benchmarks from 10,000 Simulated Markets" },
            ].map((n, i) => (
              <div className="kn-news-side-item" key={i}>
                <div className="kn-news-tags"><span className="kn-news-tag">{n.tag}</span></div>
                <h4 className="kn-news-stitle">{n.title}</h4>
                <span style={{ fontSize: "0.7rem", color: "var(--muted)", fontFamily: "var(--font-mono)" }}>May 2026 / 4 Min Read</span>
              </div>
            ))}
          </div>
        </section>

        {/* WHY KINESIS — Yellow Accent Section */}
        <section className="kn-why">
          <div className="kn-why-bg" />
          <div className="kn-why-header kn-reveal">
            <div className="kn-why-tag">Why Kinesis</div>
            <h2 className="kn-why-title">
              BUILT FOR THE <span>NEXT WAVE</span><br />OF QUANT TRADING
            </h2>
            <p className="kn-why-sub">
              Three pillars that make Kinesis the most advanced prediction market intelligence platform in the world.
            </p>
          </div>
          <div className="kn-why-grid">
            {[
              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, title: "Sub-Second Execution", desc: "AI-driven order routing executes across multiple exchanges faster than any human trader. Edge detection to execution in under 200ms." },
              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 0 1 4 4c0 2-2 4-4 4s-4-2-4-4 2-4 4-4z"/><path d="M16 14c2.3.8 4 2.5 4 5v1H4v-1c0-2.5 1.7-4.2 4-5"/><circle cx="12" cy="7" r="4"/><path d="M12 11v3"/><path d="M10 14h4"/></svg>, title: "Autonomous Intelligence", desc: "Deploy trading agents that learn, adapt, and compound returns 24/7. Set parameters, define risk, and let AI do the work." },
              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>, title: "Cross-Platform Arbitrage", desc: "Scan Polymarket, Betfair, Hyperliquid, and more simultaneously. Surface guaranteed edge before the market corrects." },
            ].map(c => (
              <div className="kn-why-card kn-reveal" key={c.title}>
                <div className="kn-why-card-icon">{c.icon}</div>
                <div className="kn-why-card-title">{c.title}</div>
                <div className="kn-why-card-desc">{c.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="kn-final-cta kn-reveal">
          <div className="kn-final-cta-bg" />
          <h2 className="kn-final-title">
            BUILD THE FUTURE OF<br /><span>PREDICTION INTELLIGENCE</span>
          </h2>
          <div className="kn-final-btns">
            <Link to="/login" className="kn-btn-primary">Launch App →</Link>
            <Link to="/login" className="kn-btn-outline">Explore Markets →</Link>
            <a href="/login" className="kn-btn-outline">Connect Wallet →</a>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="kn-footer">
          <div className="kn-footer-links">
            {[
              { title: "Platform", links: ["Agon Markets", "Agentex AI", "Arbitrage Scanner", "AI Builder", "Portfolio"] },
              { title: "Build", links: ["Developer Hub", "Documentation", "API Reference", "SDK", "Integrations"] },
              { title: "Community", links: ["Discord", "X (Twitter)", "GitHub", "Blog", "Grants"] },
              { title: "Legal", links: ["Terms of Use", "Privacy Policy", "Cookie Policy", "Risk Disclaimer"] },
            ].map(col => (
              <div className="kn-footer-col" key={col.title}>
                <div className="kn-footer-col-title">{col.title}</div>
                <ul>
                  {col.links.map(l => (
                    <li key={l}>
                      <a href="/#">{l} <span className="arr">→</span></a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="kn-footer-wordmark">
            <div className="kn-footer-big">
              kinesis&nbsp;&nbsp;&nbsp;&nbsp;kinesis&nbsp;&nbsp;&nbsp;&nbsp;kinesis&nbsp;&nbsp;&nbsp;&nbsp;kinesis&nbsp;&nbsp;&nbsp;&nbsp;kinesis&nbsp;&nbsp;&nbsp;&nbsp;kinesis&nbsp;&nbsp;&nbsp;&nbsp;kinesis&nbsp;&nbsp;&nbsp;&nbsp;kinesis&nbsp;&nbsp;&nbsp;&nbsp;kinesis&nbsp;&nbsp;&nbsp;&nbsp;kinesis&nbsp;&nbsp;&nbsp;&nbsp;kinesis&nbsp;&nbsp;&nbsp;&nbsp;kinesis&nbsp;&nbsp;&nbsp;&nbsp;
            </div>
          </div>
          <div className="kn-footer-bottom">
            <span>© 2026 Kinesis Unified Platform. All rights reserved.</span>
            <span>Built for <a href="/login">the future of quant trading →</a></span>
          </div>
        </footer>

      </div>
    </>
  );
}