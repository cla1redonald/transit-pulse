'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  as?: 'section' | 'div';
  'aria-label'?: string;
}

export function AnimatedSection({
  children,
  className = '',
  as: Tag = 'div',
  'aria-label': ariaLabel,
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReduced) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      role={Tag === 'section' ? 'region' : undefined}
      className={`${isVisible ? 'animate-fade-in-up' : 'animate-fade-in-up-pending'} ${className}`}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}
