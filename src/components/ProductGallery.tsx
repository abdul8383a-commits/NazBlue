"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

export default function ProductGallery({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollPosition = scrollContainerRef.current.scrollLeft;
      const width = scrollContainerRef.current.offsetWidth;
      const newIndex = Math.round(scrollPosition / width);
      setCurrentIndex(newIndex);
    }
  };

  useEffect(() => {
    // When thumbnail is clicked on desktop, scroll the main container if it's visible
    if (scrollContainerRef.current && window.innerWidth >= 768) {
      // Desktop doesn't use scroll snapping for main view, just sets active image
    }
  }, [currentIndex]);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-[3/4] bg-gray-100 dark:bg-[#163A7A]/20 flex items-center justify-center rounded-lg">
        <span className="text-gray-400">No Image Available</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row md:gap-6 -mx-4 sm:mx-0">
      {/* Desktop Thumbnails (Hidden on Mobile) */}
      {images.length > 1 && (
        <div className="hidden md:flex flex-col gap-3 w-20 lg:w-24 flex-shrink-0">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-full aspect-[3/4] flex-shrink-0 rounded-md overflow-hidden transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                idx === currentIndex ? "ring-1 ring-primary dark:ring-white ring-offset-1 dark:ring-offset-gray-900 opacity-100" : "opacity-60 hover:opacity-100"
              }`}
            >
              <div className="relative w-full h-full bg-gray-100 dark:bg-white/5">
                <Image src={img} alt={`Thumbnail ${idx + 1}`} fill sizes="100px" className="object-cover" />
              </div>
            </button>
          ))}
        </div>
      )}
      
      {/* Main Image Area */}
      <div className="relative flex-1 group">
        {/* Mobile Swipeable Container */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="md:hidden flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {images.map((img, idx) => (
            <div key={idx} className="relative w-full aspect-[3/4] shrink-0 snap-center bg-gray-100 dark:bg-white/5">
              <Image 
                src={img} 
                alt={`Product Image ${idx + 1}`} 
                fill
                priority={idx === 0}
                sizes="100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {/* Desktop Main Image (Fixed) */}
        <div className="hidden md:block relative w-full aspect-[3/4] bg-gray-100 dark:bg-white/5 rounded-xl overflow-hidden">
           <Image 
              src={images[currentIndex]} 
              alt="Product Main" 
              fill
              priority
              sizes="(max-width: 1024px) 50vw, 40vw"
              className="object-cover"
            />
        </div>

        {/* Mobile Dot Indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 md:hidden">
            {images.map((_, idx) => (
              <div 
                key={idx} 
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? "bg-primary dark:bg-white w-3" : "bg-primary/30 dark:bg-white/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
