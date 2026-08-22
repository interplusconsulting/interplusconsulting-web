'use client';

import { useEffect, useState } from 'react';

function WaveLine({ text, className = '', offset = 0 }: { text: string; className?: string; offset?: number }) {
  const letters = Array.from(
    new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(text),
    (item) => item.segment,
  );

  return <span className={`intro-line ${className}`}>{letters.map((letter, index) => (
    <span className="intro-char" style={{ animationDelay: `${offset + index * 0.055}s` }} key={`${letter}-${index}`}>
      {letter === ' ' ? '\u00a0' : letter}
    </span>
  ))}</span>;
}

export default function LoadingIntro() {
  const [phase, setPhase] = useState<'show' | 'leave' | 'done'>('show');

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => setPhase('leave'), 1480);
    const doneTimer = window.setTimeout(() => setPhase('done'), 2380);
    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  if (phase === 'done') return null;

  return (
    <div className={`intro-screen ${phase === 'leave' ? 'is-opening' : ''}`} aria-label="กำลังเข้าสู่เว็บไซต์">
      <div className="intro-door intro-door-left" aria-hidden="true" />
      <div className="intro-door intro-door-right" aria-hidden="true" />
      <div className="intro-content">
        <div className="intro-logo"><img src="/inter-plus-logo-transparent.webp" alt="Inter Plus Consulting" /></div>
        <h1>
          <WaveLine text="เปิดประตูสู่" className="intro-line-small" offset={0.15} />
          <WaveLine text="โอกาสใหม่" className="intro-line-accent" offset={0.3} />
          <WaveLine text="ทั่วโลก" offset={0.5} />
        </h1>
        <div className="intro-rule"><i /></div>
      </div>
      <p className="intro-caption"><span>INTER PLUS CONSULTING</span><span>THAILAND · WORLDWIDE</span></p>
    </div>
  );
}
