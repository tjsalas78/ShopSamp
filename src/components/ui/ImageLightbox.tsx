"use client";

import { useState, useEffect } from "react";
// Images are served directly from Vercel Blob URLs (no transformation needed)

interface ImageLightboxProps {
  isOpen: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export function ImageLightbox({
  isOpen,
  images,
  initialIndex = 0,
  onClose,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, images.length, onClose]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : prev));
  };

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < images.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative w-full max-h-[90vh] max-w-[90vw] animate-in zoom-in-95 fade-in duration-150">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
          </svg>
        </button>

        {/* Image */}
        <div className="flex h-full items-center justify-center bg-black/40 rounded-lg overflow-hidden">
          <img
            src={currentImage}
            alt={`Image ${currentIndex + 1} of ${images.length}`}
            className="max-h-[85vh] max-w-[85vw] object-contain"
          />
        </div>

        {/* Navigation and counter */}
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-between px-4">
          {/* Previous button */}
          <button
            onClick={goToPrevious}
            disabled={!canGoPrev}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Counter */}
          <div className="text-sm font-medium text-white bg-black/60 px-3 py-1.5 rounded-full">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Next button */}
          <button
            onClick={goToNext}
            disabled={!canGoNext}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
