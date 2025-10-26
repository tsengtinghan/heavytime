"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CreateStoryDialog from "./CreateStoryDialog";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface WeekViewProps {
  className?: string;
}

export default function WeekView({ className = "" }: WeekViewProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [direction, setDirection] = useState<number>(0);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const [isGeneratingPoem, setIsGeneratingPoem] = useState<boolean>(false);

  const formatDate = (date: Date) => {
    const month = date.toLocaleDateString("en-US", { month: "long" });
    const dayNumber = date.getDate();
    const year = date.getFullYear();
    const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
    return { month, dayNumber, year, weekday };
  };

  const formatDateForFolder = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
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

  useEffect(() => {
    const loadImages = async () => {
      setLoading(true);
      const fetchedImages = await fetchImagesForDate(currentDate);
      setImages(fetchedImages);
      setLoading(false);
    };

    loadImages();
  }, [currentDate]);

  const navigateDate = (delta: number) => {
    setDirection(delta);
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + delta);
    setCurrentDate(newDate);
  };

  const goToPreviousDay = () => navigateDate(-1);
  const goToNextDay = () => navigateDate(1);

  const handleImageClick = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedImageUrl("");
  };

  const handleGeneratePoem = async (title: string) => {
    try {
      setIsGeneratingPoem(true);

      // Step 1: Create the story in Supabase with title and camera_image
      const { data: newStory, error: insertError } = await supabase
        .from("story")
        .insert({
          title: title,
          camera_image: selectedImageUrl,
          poem_text: null, // Will be updated after poem generation
          poem_audio: null,
          comic_image: null,
        })
        .select()
        .single();

      if (insertError || !newStory) {
        throw new Error(insertError?.message || "Failed to create story");
      }

      // Step 2: Generate the poem using Anthropic API
      const response = await fetch("/api/generate-poem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: selectedImageUrl,
          title: title,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate poem");
      }

      const data = await response.json();

      // Step 3: Update the story with the generated poem
      const { error: updateError } = await supabase
        .from("story")
        .update({
          poem_text: data.poem,
        })
        .eq("id", newStory.id);

      if (updateError) {
        throw new Error(
          updateError.message || "Failed to update story with poem"
        );
      }

      // Step 4 & 5: Generate audio and comic concurrently
      const [audioResponse, comicResponse] = await Promise.all([
        fetch("/api/generate-audio", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: data.poem,
            storyId: newStory.id,
          }),
        }),
        fetch("/api/generate-comic", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            poem: data.poem,
            imageUrl: selectedImageUrl,
            storyId: newStory.id,
          }),
        }),
      ]);

      // Process audio response
      if (!audioResponse.ok) {
        console.error("Failed to generate audio");
        // Continue anyway - audio generation is optional
      } else {
        const audioData = await audioResponse.json();

        // Update the story with the audio URL
        const { error: audioUpdateError } = await supabase
          .from("story")
          .update({
            poem_audio: audioData.audioUrl,
          })
          .eq("id", newStory.id);

        if (audioUpdateError) {
          console.error(
            "Failed to update story with audio URL:",
            audioUpdateError
          );
          // Continue anyway
        }
      }

      // Process comic response
      if (!comicResponse.ok) {
        console.error("Failed to generate comic");
        // Continue anyway - comic generation is optional
      } else {
        const comicData = await comicResponse.json();

        // Update the story with the comic URL
        const { error: comicUpdateError } = await supabase
          .from("story")
          .update({
            comic_image: comicData.comicUrl,
          })
          .eq("id", newStory.id);

        if (comicUpdateError) {
          console.error(
            "Failed to update story with comic URL:",
            comicUpdateError
          );
          // Continue anyway
        }
      }

      // Step 8: Close dialog and navigate to the story detail page
      handleDialogClose();
      router.push(`/story/${newStory.id}`);
    } catch (error) {
      console.error("Error creating story:", error);
      alert(
        `Failed to create story: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsGeneratingPoem(false);
    }
  };

  const { month, dayNumber, year, weekday } = formatDate(currentDate);
  const today = isToday(currentDate);
  const isFutureDate = currentDate > new Date();

  return (
    <motion.div
      className={`w-full min-h-screen p-8 ${className}`}
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Left Navigation - Fixed to left side, vertically centered */}
      <button
        onClick={goToPreviousDay}
        className="fixed left-8 top-1/2 -translate-y-1/2 p-2 transition-all hover:scale-125 active:scale-95 text-gray-600 hover:text-gray-900"
        aria-label="Previous day"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-8 h-8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
      </button>

      {/* Right Navigation - Fixed to right side, vertically centered */}
      <button
        onClick={goToNextDay}
        disabled={isFutureDate}
        className="fixed right-8 top-1/2 -translate-y-1/2 p-2 transition-all hover:scale-125 active:scale-95 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
        aria-label="Next day"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-8 h-8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </button>

      {/* Main Content */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-center min-h-screen">
        <div className="w-full">
          {/* Header with Date */}
          <motion.div
            key={formatDateForFolder(currentDate)}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-bold mb-1">
              {month} {dayNumber}, {year}
            </h2>
            <p className="text-lg text-gray-600">{weekday}</p>
          </motion.div>

          {/* Images Grid */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center items-center py-20 w-full"
              >
                <div className="text-lg text-gray-500">Loading images...</div>
              </motion.div>
            ) : images.length === 0 ? (
              <motion.div
                key="no-images"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center items-center py-20 w-full"
              >
                <div className="text-lg text-gray-500">
                  No images for this day
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={formatDateForFolder(currentDate)}
                initial={{ opacity: 0, x: direction * 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -100 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-4 gap-6 max-w-2xl mx-auto">
                  {images.map((imageUrl, index) => (
                    <motion.div
                      key={imageUrl}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      onClick={() => handleImageClick(imageUrl)}
                      className="aspect-square bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
                    >
                      <img
                        src={imageUrl}
                        alt={`${formatDateForFolder(currentDate)}-${index}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error(`Image failed to load: ${imageUrl}`);
                          e.currentTarget.style.backgroundColor = "#fee";
                        }}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Image counter */}
                <div className="text-center mt-6 text-gray-600 text-sm">
                  {images.length} {images.length === 1 ? "image" : "images"}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Story Creation Dialog */}
      <CreateStoryDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        imageUrl={selectedImageUrl}
        onSubmit={handleGeneratePoem}
        isLoading={isGeneratingPoem}
      />
    </motion.div>
  );
}
