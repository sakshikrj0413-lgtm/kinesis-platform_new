import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

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

  [data-theme="light"] .ab-footer { background: #f4f7f4; }

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
  .ab-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    padding: 0 40px;
    border-bottom: 1px solid var(--green-border);
    background: var(--black);
    backdrop-filter: blur(12px);
  }
  .ab-nav-brand {
    display: flex; align-items: center; gap: 12px;
    text-decoration: none; color: var(--text);
    font-weight: 900; font-size: 1.2rem; letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .ab-logo-mark {
    width: 32px; height: 32px;
    background: var(--green);
    clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
    flex-shrink: 0;
  }
  .ab-nav-links {
    display: flex; align-items: center; gap: 8px;
    list-style: none;
  }
  .ab-nav-links li a {
    color: var(--text); text-decoration: none; font-size: 0.8rem;
    font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
    padding: 8px 16px; opacity: 0.6; transition: opacity 0.2s, color 0.2s;
    border-radius: 8px;
  }
  .ab-nav-links li a:hover,
  .ab-nav-links li a.active { opacity: 1; color: var(--green); background: var(--green-glow); }
  .ab-nav-actions {
    display: flex; align-items: center; gap: 16px;
  }
  .ab-theme-toggle {
    position: relative;
    width: 52px; height: 28px;
    border-radius: 14px;
    background: var(--surface2);
    border: 1px solid var(--green-border);
    cursor: pointer;
    transition: background 0.3s;
  }
  .ab-theme-toggle::after {
    content: '';
    position: absolute;
    top: 3px; left: 3px;
    width: 20px; height: 20px;
    border-radius: 50%;
    background: var(--green);
    transition: transform 0.3s cubic-bezier(.4,0,.2,1);
    box-shadow: 0 0 8px var(--green-glow);
  }
  [data-theme="light"] .ab-theme-toggle::after { transform: translateX(24px); }
  .ab-theme-toggle .ab-toggle-icon {
    position: absolute;
    top: 50%; transform: translateY(-50%);
    font-size: 0.7rem;
    transition: opacity 0.3s;
    pointer-events: none;
  }
  .ab-toggle-icon.moon { left: 7px; opacity: 1; }
  .ab-toggle-icon.sun { right: 7px; opacity: 0.4; }
  [data-theme="light"] .ab-toggle-icon.moon { opacity: 0.4; }
  [data-theme="light"] .ab-toggle-icon.sun { opacity: 1; }
  .ab-nav-cta {
    display: flex; align-items: center;
    background: var(--green); color: #000 !important;
    border: none; cursor: pointer; padding: 10px 24px;
    font-family: var(--font-display); font-weight: 900;
    font-size: 0.8rem; letter-spacing: 0.06em; text-transform: uppercase;
    text-decoration: none; gap: 8px;
    border-radius: 8px;
    transition: background 0.2s, box-shadow 0.2s;
  }
  .ab-nav-cta:hover { background: #00ff99; box-shadow: 0 0 20px var(--green-glow); }

  /* ── HERO ── */
  .ab-hero {
    min-height: 90vh;
    display: grid;
    grid-template-columns: 1fr 1fr;
    border: 1px solid var(--green-border);
    margin: 0 32px;
    border-radius: 24px;
    overflow: hidden;
  }
  .ab-hero-left {
    display: flex; flex-direction: column; justify-content: center;
    padding: 80px 64px;
    border-right: 1px solid var(--green-border);
    position: relative;
  }
  .ab-hero-tag {
    display: inline-block;
    background: var(--green); color: #000;
    padding: 6px 18px;
    font-size: 0.7rem; font-weight: 900; letter-spacing: 0.12em;
    text-transform: uppercase; border-radius: 4px;
    margin-bottom: 24px;
    width: fit-content;
  }
  .ab-hero-title {
    font-size: clamp(3rem, 6vw, 5rem);
    font-weight: 900; text-transform: uppercase; line-height: 1.05;
    letter-spacing: -0.02em;
    margin-bottom: 24px;
  }
  .ab-hero-title span { color: var(--green); }
  .ab-hero-desc {
    font-size: 0.95rem; line-height: 1.8; color: var(--muted);
    max-width: 480px; margin-bottom: 40px;
  }
  .ab-hero-actions { display: flex; gap: 16px; flex-wrap: wrap; }
  .ab-btn-primary {
    display: flex; align-items: center; gap: 12px;
    background: var(--green); color: #000;
    border: none; padding: 14px 28px; cursor: pointer;
    font-family: var(--font-display); font-weight: 900;
    font-size: 0.85rem; letter-spacing: 0.06em; text-transform: uppercase;
    text-decoration: none; transition: background 0.2s;
  }
  .ab-btn-primary:hover { background: #00ff99; }
  .ab-btn-outline {
    display: flex; align-items: center; gap: 12px;
    background: transparent; color: var(--text);
    border: 1px solid var(--green-border); padding: 14px 28px; cursor: pointer;
    font-family: var(--font-display); font-weight: 700;
    font-size: 0.85rem; letter-spacing: 0.06em; text-transform: uppercase;
    text-decoration: none; transition: border-color 0.2s, color 0.2s;
  }
  .ab-btn-outline:hover { border-color: var(--green); color: var(--green); }

  .ab-hero-right {
    display: flex; align-items: center; justify-content: center;
    background: var(--surface);
    overflow: hidden;
    position: relative;
  }
  .ab-hero-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(var(--green-border) 1px, transparent 1px),
      linear-gradient(90deg, var(--green-border) 1px, transparent 1px);
    background-size: 48px 48px;
    opacity: 0.4;
  }
  .ab-hero-graphic {
    position: relative; z-index: 2;
    width: 420px; height: 420px;
    display: flex; align-items: center; justify-content: center;
  }
  .ab-graphic-ring {
    position: absolute;
    border: 1px solid var(--green-border);
    border-radius: 50%;
  }
  .ab-graphic-ring:nth-child(1) {
    width: 100%; height: 100%;
    animation: abRingSpin 12s linear infinite;
  }
  .ab-graphic-ring:nth-child(2) {
    width: 70%; height: 70%;
    animation: abRingSpin 18s linear infinite reverse;
    border-style: dashed;
  }
  .ab-graphic-ring:nth-child(3) {
    width: 40%; height: 40%;
    animation: abRingSpin 8s linear infinite;
    background: radial-gradient(circle, var(--green-glow) 0%, transparent 70%);
    box-shadow: 0 0 60px var(--green-glow);
  }
  @keyframes abRingSpin {
    0% { transform: rotate(0deg); opacity: 0.4; }
    50% { opacity: 0.8; }
    100% { transform: rotate(360deg); opacity: 0.4; }
  }
  .ab-graphic-dot {
    position: absolute; width: 6px; height: 6px; border-radius: 50%;
    background: var(--green); box-shadow: 0 0 12px var(--green);
  }
  .ab-graphic-ring:nth-child(1) .ab-graphic-dot:nth-child(1) { top: -3px; left: 50%; }
  .ab-graphic-ring:nth-child(1) .ab-graphic-dot:nth-child(2) { bottom: -3px; left: 50%; }
  .ab-graphic-ring:nth-child(1) .ab-graphic-dot:nth-child(3) { left: -3px; top: 50%; }
  .ab-graphic-ring:nth-child(1) .ab-graphic-dot:nth-child(4) { right: -3px; top: 50%; }
  .ab-graphic-core {
    width: 80px; height: 80px;
    border-radius: 20px;
    transform: rotate(45deg);
    background: radial-gradient(circle at 30% 30%, var(--green) 0%, var(--green-dim) 50%, transparent 80%);
    box-shadow: 0 0 60px var(--green), 0 0 120px var(--green-glow);
    animation: abCoreFire 2.5s ease-in-out infinite;
    position: absolute;
  }
  @keyframes abCoreFire {
    0%, 100% { transform: rotate(45deg) scale(0.85); opacity: 0.8; box-shadow: 0 0 40px var(--green); }
    50% { transform: rotate(45deg) scale(1.1); opacity: 1; box-shadow: 0 0 80px var(--green), 0 0 140px var(--green-glow); }
  }
  .ab-graphic-orbit {
    position: absolute; width: 160px; height: 160px;
    border: 1px solid var(--green-border);
    border-radius: 12px;
    transform: rotate(45deg);
    animation: abOrbitSpin 20s linear infinite;
  }
  @keyframes abOrbitSpin {
    0% { transform: rotate(45deg); border-color: var(--green-border); }
    50% { border-color: var(--green); box-shadow: 0 0 30px var(--green-glow); }
    100% { transform: rotate(405deg); border-color: var(--green-border); }
  }
  .ab-graphic-orbit::before, .ab-graphic-orbit::after {
    content: ''; position: absolute;
    width: 10px; height: 10px; border-radius: 50%; background: var(--green);
    box-shadow: 0 0 16px var(--green);
  }
  .ab-graphic-orbit::before { top: -5px; left: 50%; }
  .ab-graphic-orbit::after { bottom: -5px; left: 50%; }

  /* ── STATS BAR ── */
  .ab-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border: 1px solid var(--green-border);
    margin: 0 32px;
    border-radius: 24px;
    overflow: hidden;
  }
  .ab-stat {
    padding: 40px 32px;
    text-align: center;
    border-right: 1px solid var(--green-border);
  }
  .ab-stat:last-child { border-right: none; }
  .ab-stat-num {
    font-size: 2.4rem; font-weight: 900;
    color: var(--green); line-height: 1;
    margin-bottom: 6px;
    font-family: var(--font-mono);
  }
  .ab-stat-label {
    font-size: 0.72rem; color: var(--muted);
    text-transform: uppercase; letter-spacing: 0.1em;
  }

  /* ── STORY ── */
  .ab-story {
    padding: 100px 64px;
    border: 1px solid var(--green-border);
    margin: 0 32px;
    border-radius: 24px;
    overflow: hidden;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 80px;
    align-items: center;
  }
  .ab-story-tag {
    font-size: 0.7rem; color: var(--green); text-transform: uppercase;
    letter-spacing: 0.15em; font-weight: 700; margin-bottom: 16px;
  }
  .ab-story-title {
    font-size: clamp(2rem, 3.5vw, 3rem);
    font-weight: 900; text-transform: uppercase; line-height: 1.1;
    margin-bottom: 20px;
  }
  .ab-story-text {
    font-size: 0.9rem; line-height: 1.8; color: var(--muted);
  }
  .ab-story-text p { margin-bottom: 16px; }
  .ab-story-visual {
    background: var(--surface);
    border: 1px solid var(--green-border);
    border-radius: 16px;
    padding: 40px;
    position: relative;
    min-height: 320px;
    display: flex; flex-direction: column; justify-content: center;
    overflow: hidden;
  }
  .ab-story-visual-bg {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 30% 50%, var(--green-glow) 0%, transparent 60%);
    pointer-events: none;
  }
  .ab-milestone {
    display: flex; align-items: center; gap: 20px;
    padding: 16px 0;
    border-bottom: 1px solid rgba(0,255,136,0.08);
    position: relative; z-index: 1;
  }
  .ab-milestone:last-child { border-bottom: none; }
  .ab-milestone-year {
    font-family: var(--font-mono);
    font-size: 1.1rem; font-weight: 700; color: var(--green);
    min-width: 60px;
  }
  .ab-milestone-desc {
    font-size: 0.85rem; line-height: 1.4; color: var(--text);
  }
  .ab-milestone-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--green); flex-shrink: 0;
    box-shadow: 0 0 8px var(--green);
  }

  /* ── VALUES ── */
  .ab-values {
    padding: 100px 64px;
    border: 1px solid var(--yellow-border);
    margin: 0 32px;
    border-radius: 24px;
    overflow: hidden;
    background: linear-gradient(180deg, var(--black) 0%, rgba(255,215,0,0.02) 50%, var(--black) 100%);
    position: relative;
  }
  .ab-values-bg {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 70% 30%, rgba(255,215,0,0.04) 0%, transparent 60%);
    pointer-events: none;
  }
  .ab-values-header { text-align: center; margin-bottom: 64px; }
  .ab-values-tag {
    display: inline-block;
    background: var(--yellow); color: #000;
    padding: 6px 20px;
    font-size: 0.7rem; font-weight: 900; letter-spacing: 0.12em;
    text-transform: uppercase; border-radius: 4px;
    margin-bottom: 20px;
  }
  .ab-values-title {
    font-size: clamp(2rem, 4vw, 3.2rem);
    font-weight: 900; text-transform: uppercase; line-height: 1.1;
  }
  .ab-values-title span { color: var(--yellow); }
  .ab-values-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px; max-width: 1100px; margin: 0 auto;
    position: relative; z-index: 1;
  }
  .ab-value-card {
    background: var(--surface);
    border: 1px solid var(--yellow-border);
    border-radius: 16px;
    padding: 36px 28px;
    text-align: center;
    transition: transform 0.3s, box-shadow 0.3s, background 0.3s;
  }
  .ab-value-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 40px rgba(255,215,0,0.08);
    background: var(--surface2);
  }
  .ab-value-icon {
    width: 56px; height: 56px;
    margin: 0 auto 20px;
    border-radius: 14px;
    background: rgba(255,215,0,0.1);
    border: 1px solid var(--yellow-border);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.5rem; color: var(--yellow);
  }
  .ab-value-title {
    font-size: 1rem; font-weight: 900; text-transform: uppercase;
    letter-spacing: 0.04em; margin-bottom: 10px;
  }
  .ab-value-desc {
    font-size: 0.82rem; line-height: 1.6; color: var(--muted);
  }

  /* ── TECH ── */
  .ab-tech {
    padding: 100px 64px;
    border: 1px solid var(--green-border);
    margin: 0 32px;
    border-radius: 24px;
    overflow: hidden;
  }
  .ab-tech-header { text-align: center; margin-bottom: 64px; }
  .ab-tech-tag {
    font-size: 0.7rem; color: var(--green); text-transform: uppercase;
    letter-spacing: 0.15em; font-weight: 700; margin-bottom: 16px;
  }
  .ab-tech-title {
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 900; text-transform: uppercase; line-height: 1.1;
  }
  .ab-tech-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1px;
    background: var(--green-border);
    border: 1px solid var(--green-border);
    border-radius: 16px;
    overflow: hidden;
  }
  .ab-tech-cell {
    background: var(--surface);
    padding: 40px 32px;
    display: flex; flex-direction: column; gap: 8px;
  }
  .ab-tech-cell-label {
    font-size: 0.65rem; color: var(--muted);
    text-transform: uppercase; letter-spacing: 0.12em;
    font-family: var(--font-mono);
  }
  .ab-tech-cell-title {
    font-size: 1.2rem; font-weight: 900; text-transform: uppercase;
    color: var(--green);
  }
  .ab-tech-cell-desc {
    font-size: 0.82rem; line-height: 1.6; color: var(--muted);
  }

  /* ── TEAM ── */
  .ab-team {
    padding: 100px 64px;
    border: 1px solid var(--green-border);
    margin: 0 32px;
    border-radius: 24px;
    overflow: hidden;
  }
  .ab-team-header { text-align: center; margin-bottom: 64px; }
  .ab-team-tag {
    font-size: 0.7rem; color: var(--green); text-transform: uppercase;
    letter-spacing: 0.15em; font-weight: 700; margin-bottom: 16px;
  }
  .ab-team-title {
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 900; text-transform: uppercase; line-height: 1.1;
    margin-bottom: 12px;
  }
  .ab-team-sub {
    font-size: 0.9rem; color: var(--muted); max-width: 500px;
    margin: 0 auto; line-height: 1.7;
  }
  .ab-team-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }
  .ab-team-card {
    background: var(--surface);
    border: 1px solid var(--green-border);
    border-radius: 12px;
    padding: 28px 20px;
    text-align: center;
    transition: transform 0.3s, box-shadow 0.3s;
  }
  .ab-team-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0,255,136,0.06);
  }
  .ab-team-avatar {
    width: 64px; height: 64px;
    border-radius: 50%;
    background: var(--surface3);
    border: 2px solid var(--green-border);
    margin: 0 auto 16px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.6rem; font-weight: 900; color: var(--green);
    font-family: var(--font-mono);
  }
  .ab-team-name {
    font-size: 0.95rem; font-weight: 900; text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .ab-team-role {
    font-size: 0.72rem; color: var(--muted);
    text-transform: uppercase; letter-spacing: 0.1em;
    margin-top: 4px;
  }

  /* ── FINAL CTA ── */
  .ab-cta {
    padding: 120px 64px;
    text-align: center;
    border: 1px solid var(--green-border);
    margin: 0 32px;
    border-radius: 24px;
    position: relative; overflow: hidden;
  }
  .ab-cta-bg {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at center, rgba(0,255,136,0.06) 0%, transparent 70%);
  }
  .ab-cta-title {
    font-size: clamp(2.5rem, 5vw, 4.5rem);
    font-weight: 900; text-transform: uppercase; line-height: 1.05;
    max-width: 900px; margin: 0 auto 40px; position: relative;
  }
  .ab-cta-title span { color: var(--green); }
  .ab-cta-actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; position: relative; }

  /* ── FOOTER ── */
  .ab-footer { background: var(--black); }
  .ab-footer-inner {
    display: flex; justify-content: space-between; align-items: center;
    padding: 32px 64px;
    border-top: 1px solid var(--green-border);
    font-size: 0.75rem; color: var(--muted);
  }
  .ab-footer-inner a { color: var(--green); text-decoration: none; }
  .ab-footer-links { display: flex; gap: 24px; }
  .ab-footer-links a { color: var(--muted); text-decoration: none; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; transition: color 0.2s; }
  .ab-footer-links a:hover { color: var(--green); }

  /* ── REVEAL ── */
  .ab-reveal {
    opacity: 0;
    transform: translateY(40px);
    transition: opacity 0.7s cubic-bezier(.4,0,.2,1), transform 0.7s cubic-bezier(.4,0,.2,1);
  }
  .ab-reveal.ab-revealed {
    opacity: 1;
    transform: translateY(0);
  }
  .ab-reveal-left {
    opacity: 0;
    transform: translateX(-40px);
    transition: opacity 0.7s cubic-bezier(.4,0,.2,1), transform 0.7s cubic-bezier(.4,0,.2,1);
  }
  .ab-reveal-left.ab-revealed {
    opacity: 1;
    transform: translateX(0);
  }
  .ab-reveal-right {
    opacity: 0;
    transform: translateX(40px);
    transition: opacity 0.7s cubic-bezier(.4,0,.2,1), transform 0.7s cubic-bezier(.4,0,.2,1);
  }
  .ab-reveal-right.ab-revealed {
    opacity: 1;
    transform: translateX(0);
  }
  .ab-reveal-scale {
    opacity: 0;
    transform: scale(0.9);
    transition: opacity 0.7s cubic-bezier(.4,0,.2,1), transform 0.7s cubic-bezier(.4,0,.2,1);
  }
  .ab-reveal-scale.ab-revealed {
    opacity: 1;
    transform: scale(1);
  }

  /* ── RESPONSIVE ── */
  @media (max-width: 900px) {
    .ab-hero { grid-template-columns: 1fr; margin: 0 16px; border-radius: 16px; }
    .ab-hero-left { padding: 48px 24px; }
    .ab-hero-right { min-height: 300px; }
    .ab-stats { grid-template-columns: repeat(2, 1fr); margin: 0 16px; border-radius: 16px; }
    .ab-stat:nth-child(2) { border-right: none; }
    .ab-story { grid-template-columns: 1fr; padding: 60px 24px; gap: 40px; margin: 0 16px; border-radius: 16px; }
    .ab-values { padding: 60px 24px; margin: 0 16px; border-radius: 16px; }
    .ab-values-grid { grid-template-columns: 1fr; }
    .ab-tech { padding: 60px 24px; margin: 0 16px; border-radius: 16px; }
    .ab-tech-grid { grid-template-columns: 1fr; }
    .ab-team { padding: 60px 24px; margin: 0 16px; border-radius: 16px; }
    .ab-team-grid { grid-template-columns: repeat(2, 1fr); }
    .ab-cta { padding: 80px 24px; margin: 0 16px; border-radius: 16px; }
    .ab-nav { padding: 0 20px; }
    .ab-nav-links { display: none; }
    .ab-footer-inner { flex-direction: column; gap: 16px; padding: 24px 20px; }
  }
`;

function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('ab-revealed');
          }
        });
      },
      { threshold: 0.12 }
    );
    const els = document.querySelectorAll('.ab-reveal, .ab-reveal-left, .ab-reveal-right, .ab-reveal-scale');
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

export default function About() {
  const [theme, setTheme] = useState("dark");

  useScrollReveal();

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const values = [
    { icon: "◈", title: "Radical Transparency", desc: "Every trade, every fee, every decision is recorded on-chain and verifiable by anyone. No dark pools, no hidden mechanics." },
    { icon: "⚡", title: "Real-Time Intelligence", desc: "Our AI layer processes market signals in milliseconds, surfacing edges before they vanish. Speed is not a feature — it's the foundation." },
    { icon: "🔗", title: "Decentralized by Design", desc: "Kinesis operates across a distributed network of agents, exchanges, and data sources. No single point of failure. No central authority." },
    { icon: "🧠", title: "Autonomous Execution", desc: "From signal detection to trade settlement, the entire pipeline runs without human intervention. Set your parameters and let the system work." },
    { icon: "🌐", title: "Cross-Platform Liquidity", desc: "Aggregate liquidity from every major prediction market and exchange. Kinesis routes your capital to the best available odds." },
    { icon: "🔬", title: "Quant-Grade Analytics", desc: "Institutional tools that were once reserved for hedge funds are now available to every trader. Backtest, simulate, and optimize with precision." },
  ];

  const milestones = [
    { year: "2022", desc: "Kinesis founded by a team of quant analysts and blockchain engineers. First prototype of the arbitrage scanner built." },
    { year: "2023", desc: "Agon exchange launch with support for binary and multi-outcome markets. 10,000+ registered traders in the first quarter." },
    { year: "2024", desc: "Agentex AI layer launched. Cross-platform arbitrage engine goes live. $1B in cumulative trading volume reached." },
    { year: "2025", desc: "50,000+ active traders. Kinesis Agent Framework open-sourced. Enterprise partnerships with institutional liquidity providers." },
    { year: "2026", desc: "Global expansion into regulated markets. AI Builder platform launched. $5B+ in total volume processed." },
  ];

  const tech = [
    { label: "Exchange Engine", title: "Agon Markets", desc: "High-performance orderbook matching engine built in Rust, handling 100k+ trades per second with sub-millisecond latency." },
    { label: "AI Layer", title: "Agentex", desc: "Multi-model AI pipeline combining LLMs, reinforcement learning, and statistical arbitrage models for real-time market analysis." },
    { label: "Smart Contracts", title: "On-Chain Settlement", desc: "Self-executing smart contracts on Ethereum L2 ensure trustless settlement. Every market outcome is verifiable on-chain." },
    { label: "Data Infrastructure", title: "Real-Time Signals", desc: "Distributed data mesh ingesting 500+ data streams — on-chain events, social sentiment, news, and institutional feeds." },
  ];

  const team = [
    { initials: "AK", name: "Arjun Kapoor", role: "CEO / Co-Founder" },
    { initials: "LM", name: "Lena Moss", role: "CTO / Co-Founder" },
    { initials: "XR", name: "Xavier Reed", role: "Head of AI" },
    { initials: "SC", name: "Sofia Chen", role: "Head of Engineering" },
  ];

  return (
    <>
      <style>{css}</style>
      <div data-theme={theme}>

        {/* NAV */}
        <nav className="ab-nav">
          <Link to="/" className="ab-nav-brand">
            <div className="ab-logo-mark" />
            Kinesis
          </Link>
          <ul className="ab-nav-links">
            {["Markets", "Agents", "Arbitrage", "Builder", "About"].map(l => (
              <li key={l}><Link to={l === "Markets" ? "/markets" : `/${l.toLowerCase()}`} className={l === "About" ? "active" : ""}>{l}</Link></li>
            ))}
          </ul>
          <div className="ab-nav-actions">
            <button className="ab-theme-toggle" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>
              <span className="ab-toggle-icon moon">☾</span>
              <span className="ab-toggle-icon sun">☀</span>
            </button>
            <Link to="/login" className="ab-nav-cta">Launch →</Link>
          </div>
        </nav>

        {/* HERO */}
        <section className="ab-hero">
          <div className="ab-hero-left">
            <div className="ab-hero-tag">About Kinesis</div>
            <h1 className="ab-hero-title">
              THE <span>INTELLIGENCE</span><br />
              LAYER FOR PREDICTION<br />
              MARKETS
            </h1>
            <p className="ab-hero-desc">
              Kinesis is a unified AI-powered ecosystem connecting prediction market traders, 
              autonomous agents, and institutional quants. We aggregate liquidity, surface 
              arbitrage opportunities, and execute strategies across every major platform.
            </p>
            <div className="ab-hero-actions">
              <Link to="/markets" className="ab-btn-primary">Explore Markets →</Link>
              <Link to="/register" className="ab-btn-outline">Get Started →</Link>
            </div>
          </div>
          <div className="ab-hero-right">
            <div className="ab-hero-grid" />
            <div className="ab-hero-graphic">
              <div className="ab-graphic-ring">
                <div className="ab-graphic-dot" />
                <div className="ab-graphic-dot" />
                <div className="ab-graphic-dot" />
                <div className="ab-graphic-dot" />
              </div>
              <div className="ab-graphic-ring" />
              <div className="ab-graphic-ring" />
              <div className="ab-graphic-orbit" />
              <div className="ab-graphic-core" />
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="ab-stats">
          {[
            { num: "$5.2B+", label: "Total Volume" },
            { num: "52K+", label: "Active Traders" },
            { num: "143", label: "Markets Covered" },
            { num: "99.2%", label: "Platform Uptime" },
          ].map((s, i) => (
            <div className="ab-stat ab-reveal" key={i}>
              <div className="ab-stat-num">{s.num}</div>
              <div className="ab-stat-label">{s.label}</div>
            </div>
          ))}
        </section>

        {/* STORY */}
        <section className="ab-story">
          <div className="ab-reveal-left">
            <div className="ab-story-tag">Our Story</div>
            <h2 className="ab-story-title">FROM A THESIS TO<br />A GLOBAL ECOSYSTEM</h2>
            <div className="ab-story-text">
              <p>
                Kinesis began with a simple observation: prediction markets were fragmented, 
                inaccessible to retail traders, and lacked the AI-grade infrastructure that 
                institutional players demanded.
              </p>
              <p>
                Our founding team — a group of quantitative analysts, blockchain engineers, 
                and AI researchers — set out to build the missing layer. A unified platform 
                that would bring hedge-fund-level tools to every trader, powered by autonomous 
                AI agents operating 24/7 across every market vertical.
              </p>
              <p>
                Today, Kinesis processes millions of trades per day across sports, crypto, 
                finance, and event-driven markets. Our Agentex AI layer executes strategies 
                autonomously, the arbitrage engine scans for edge in real-time, and the Agon 
                exchange provides institutional-grade orderbook matching.
              </p>
            </div>
          </div>
          <div className="ab-story-visual ab-reveal-right">
            <div className="ab-story-visual-bg" />
            {milestones.map((m, i) => (
              <div className="ab-milestone" key={i}>
                <div className="ab-milestone-dot" />
                <div className="ab-milestone-year">{m.year}</div>
                <div className="ab-milestone-desc">{m.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* VALUES */}
        <section className="ab-values">
          <div className="ab-values-bg" />
          <div className="ab-values-header ab-reveal">
            <div className="ab-values-tag">Core Values</div>
            <h2 className="ab-values-title">WHAT DRIVES <span>EVERY TRADE</span></h2>
          </div>
          <div className="ab-values-grid">
            {values.map((v, i) => (
              <div className="ab-value-card ab-reveal-scale" key={i}>
                <div className="ab-value-icon">{v.icon}</div>
                <div className="ab-value-title">{v.title}</div>
                <div className="ab-value-desc">{v.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* TECH */}
        <section className="ab-tech">
          <div className="ab-tech-header ab-reveal">
            <div className="ab-tech-tag">Technology Stack</div>
            <h2 className="ab-tech-title">BUILT FOR SPEED &amp; SCALE</h2>
          </div>
          <div className="ab-tech-grid">
            {tech.map((t, i) => (
              <div className="ab-tech-cell ab-reveal" key={i}>
                <div className="ab-tech-cell-label">{t.label}</div>
                <div className="ab-tech-cell-title">{t.title}</div>
                <div className="ab-tech-cell-desc">{t.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* TEAM */}
        <section className="ab-team">
          <div className="ab-team-header ab-reveal">
            <div className="ab-team-tag">Leadership</div>
            <h2 className="ab-team-title">THE MINDS BEHIND KINESIS</h2>
            <p className="ab-team-sub">
              A global team of engineers, quants, and researchers building the future of 
              autonomous prediction market intelligence.
            </p>
          </div>
          <div className="ab-team-grid">
            {team.map((m, i) => (
              <div className="ab-team-card ab-reveal-scale" key={i}>
                <div className="ab-team-avatar">{m.initials}</div>
                <div className="ab-team-name">{m.name}</div>
                <div className="ab-team-role">{m.role}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="ab-cta">
          <div className="ab-cta-bg" />
          <h2 className="ab-cta-title ab-reveal">
            READY TO TRADE WITH<br />
            <span>INSTITUTIONAL-GRADE</span><br />
            INTELLIGENCE?
          </h2>
          <div className="ab-cta-actions">
            <Link to="/register" className="ab-btn-primary">Create Free Account →</Link>
            <Link to="/markets" className="ab-btn-outline">Explore Markets →</Link>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="ab-footer">
          <div className="ab-footer-inner">
            <span>© 2026 Kinesis. All rights reserved.</span>
            <div className="ab-footer-links">
              <a href="/login">Privacy</a>
              <a href="/login">Terms</a>
              <a href="/login">Docs</a>
              <a href="/login">Contact</a>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
