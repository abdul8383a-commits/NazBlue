"use client";

import { useState } from "react";
import Image from "next/image";

export default function ProductGallery({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-[4/5] bg-gray-100 flex items-center justify-center rounded-lg">
        <span className="text-gray-400">No Image Available</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4">
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex md:flex-col gap-2 overflow-x-auto md:w-20 flex-shrink-0 scrollbar-hide">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-16 h-20 md:w-full flex-shrink-0 border-2 rounded overflow-hidden transition-all ${
                idx === currentIndex ? "border-primary" : "border-transparent hover:border-gray-300"
              }`}
            >
              <div className="relative w-full h-full">
                <Image src={img} alt={`Thumbnail ${idx + 1}`} fill sizes="100px" className="object-cover" />
              </div>
            </button>
          ))}
        </div>
      )}
      
      {/* Main Image */}
      <div className="relative flex-1 aspect-[4/5] bg-gray-50 rounded-lg overflow-hidden">
        <Image 
          src={images[currentIndex]} 
          alt="Product Main" 
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}
