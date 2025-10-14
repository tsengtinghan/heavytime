'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WeekViewProps {
  className?: string;
}

interface DayImages {
  [dateString: string]: string[];
}

export default function WeekView({ className = '' }: WeekViewProps) {
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [dayImages, setDayImages] = useState<DayImages>({});
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const getDaysOfWeek = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      days.push(date);
    }
    
    return days;
  };

  const formatDate = (date: Date) => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNumber = date.getDate();
    return { dayName, dayNumber };
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const formatCurrentDate = (date?: Date) => {
    const targetDate = date || new Date();
    const month = targetDate.toLocaleDateString('en-US', { month: 'short' });
    const day = targetDate.getDate();
    const year = targetDate.getFullYear();
    return { month, day, year };
  };

  const formatDateForFolder = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchImagesForDate = async (date: Date): Promise<string[]> => {
    const dateString = formatDateForFolder(date);
    
    try {
      const response = await fetch(`/api/images/${dateString}`);
      
      if (!response.ok) {
        console.warn(`Failed to fetch images for ${dateString}: ${response.status}`);
        return [];
      }
      
      const data = await response.json();
      return data.images || [];
    } catch (error) {
      console.error(`Failed to fetch images for ${dateString}:`, error);
      return [];
    }
  };

  const days = getDaysOfWeek();
  const displayDate = hoveredDate || new Date();
  const { month, day, year } = formatCurrentDate(displayDate);

  useEffect(() => {
    const loadAllImages = async () => {
      const imagePromises = days.map(async (date) => {
        const dateString = formatDateForFolder(date);
        setLoadingImages(prev => new Set([...prev, dateString]));
        
        const images = await fetchImagesForDate(date);
        
        setDayImages(prev => ({
          ...prev,
          [dateString]: images
        }));
        
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(dateString);
          return newSet;
        });
      });
      
      await Promise.all(imagePromises);
    };
    
    loadAllImages();
  }, []);

  const ImageStack = ({ images, dateString }: { images: string[], dateString: string }) => {
    const isLoading = loadingImages.has(dateString);
    
    return (
      <div className="flex flex-col items-center gap-1 min-h-[100px]">
        {isLoading ? (
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        ) : (
          images.map((imageUrl, index) => (
            <motion.div
              key={`${dateString}-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded shadow-sm overflow-hidden hover:scale-110 transition-transform cursor-pointer"
            >
              <img
                src={imageUrl}
                alt={`Image ${index + 1} for ${dateString}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Hide broken images
                  e.currentTarget.style.display = 'none';
                }}
              />
            </motion.div>
          ))
        )}
      </div>
    );
  };

  return (
    <motion.div 
      className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 ${className}`}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 px-8 py-6">
        <div className="text-center mb-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${month}-${day}-${year}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="text-xl font-bold text-gray-800 dark:text-gray-100"
            >
              <span className="text-2xl">{month} {day}</span>
              <span className="text-sm ml-2 text-gray-500 dark:text-gray-400">{year}</span>
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Image Stacks */}
        <div className="flex gap-6 mb-6">
          {days.map((date, index) => {
            const dateString = formatDateForFolder(date);
            const images = dayImages[dateString] || [];
            
            return (
              <div key={index} className="flex flex-col items-center min-w-[50px]">
                <ImageStack images={images} dateString={dateString} />
              </div>
            );
          })}
        </div>
        
        {/* Date Row */}
        <div className="flex gap-6">
          {days.map((date, index) => {
            const { dayName, dayNumber } = formatDate(date);
            const today = isToday(date);
            const isHovered = hoveredDate?.toDateString() === date.toDateString();
            
            return (
              <motion.div
                key={index}
                className={`flex flex-col items-center min-w-[50px] cursor-pointer transition-colors ${
                  today 
                    ? 'text-blue-600 dark:text-blue-400 font-semibold' 
                    : 'text-gray-600 dark:text-gray-300'
                }`}
                onMouseEnter={() => setHoveredDate(date)}
                onMouseLeave={() => setHoveredDate(null)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                <div className="text-xs uppercase tracking-wide mb-1">
                  {dayName}
                </div>
                <motion.div 
                  className={`text-lg leading-none relative ${
                    today 
                      ? 'bg-blue-100 dark:bg-blue-900/30 rounded-full w-8 h-8 flex items-center justify-center' 
                      : ''
                  }`}
                  animate={{
                    backgroundColor: isHovered && !today 
                      ? 'rgba(156, 163, 175, 0.2)' 
                      : today 
                        ? undefined 
                        : 'transparent'
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {!today && isHovered && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute inset-0 bg-gray-400/20 dark:bg-gray-500/20 rounded-full"
                      transition={{ duration: 0.15 }}
                    />
                  )}
                  <span className="relative z-10">{dayNumber}</span>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}