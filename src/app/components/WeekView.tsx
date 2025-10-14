"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface WeekViewProps {
  className?: string;
}

interface DayImages {
  [dateString: string]: string[];
}

export default function WeekView({ className = "" }: WeekViewProps) {
  const [dayImages, setDayImages] = useState<DayImages>({});
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  // Memoize days to prevent re-rendering and re-fetching images
  const days = useMemo(() => {
    const daysArray = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      daysArray.push(date);
    }

    return daysArray;
  }, []);

  // Layout configuration (static)
  const dockConfig = useMemo(
    () => ({
      baseColumnWidth: 80,
      baseSpacing: 24,
    }),
    []
  );

  const formatDate = (date: Date) => {
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const dayNumber = date.getDate();
    const year = date.getFullYear();
    return { month, dayNumber, year };
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const formatDateForFolder = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchImagesForDate = async (date: Date): Promise<string[]> => {
    const dateString = formatDateForFolder(date);

    try {
      const response = await fetch(`/api/images/${dateString}`);

      if (!response.ok) {
        console.warn(
          `Failed to fetch images for ${dateString}: ${response.status}`
        );
        return [];
      }

      const data = await response.json();
      return data.images || [];
    } catch (error) {
      console.error(`Failed to fetch images for ${dateString}:`, error);
      return [];
    }
  };

  // No magnification; static layout

  useEffect(() => {
    const loadAllImages = async () => {
      const imagePromises = days.map(async (date) => {
        const dateString = formatDateForFolder(date);
        setLoadingImages((prev) => new Set([...prev, dateString]));

        const images = await fetchImagesForDate(date);

        setDayImages((prev) => ({
          ...prev,
          [dateString]: images,
        }));

        setLoadingImages((prev) => {
          const newSet = new Set(prev);
          newSet.delete(dateString);
          return newSet;
        });
      });

      await Promise.all(imagePromises);
    };

    loadAllImages();
  }, [days]); // Now depends on memoized days array

  // No mouse tracking

  // Calculate total content width
  const contentWidth =
    days.length * (dockConfig.baseColumnWidth + dockConfig.baseSpacing) -
    dockConfig.baseSpacing;

  // Get all images for debugging
  const allImages = Object.values(dayImages).flat();

  return (
    <motion.div
      className={`w-full min-h-screen p-8 flex items-center justify-center ${className}`}
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="w-full max-w-7xl">
        <div className="flex gap-8 justify-center items-end flex-wrap">
          {days.map((date, index) => {
            const dateString = formatDateForFolder(date);
            const images = dayImages[dateString] || [];
            const { month, dayNumber, year } = formatDate(date);

            return (
              <div
                key={index}
                className="flex flex-col items-center p-2"
                style={{ minWidth: "120px" }}
              >
                {/* Images First - Stack from bottom */}
                <div className="flex flex-col-reverse gap-1 mb-2">
                  {images.map((imageUrl, imgIndex) => (
                    <motion.div
                      key={imgIndex}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: imgIndex * 0.1, duration: 0.3 }}
                      className="w-12 h-12 bg-gray-200 rounded overflow-hidden hover:scale-110 transition-transform cursor-pointer"
                    >
                      <img
                        src={imageUrl}
                        alt={`${dateString}-${imgIndex}`}
                        className="w-full h-full object-cover"
                        style={{ display: "block" }}
                        onLoad={() =>
                          console.log(`Calendar image loaded: ${imageUrl}`)
                        }
                        onError={(e) => {
                          console.error(`Calendar image failed: ${imageUrl}`);
                          e.currentTarget.style.backgroundColor = "red";
                        }}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Date at Bottom (static) */}
                <div className="text-center mt-2">
                  <div className="text-sm font-semibold">
                    {month} {dayNumber}
                  </div>
                  <div className="text-xs text-gray-500">{year}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
