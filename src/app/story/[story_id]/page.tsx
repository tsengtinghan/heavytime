"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { supabase, Story } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import SunlightBackground from "../../components/SunlightBackground";

export default function StoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const story_id = params.story_id as string;

  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("story")
          .select("*")
          .eq("id", story_id)
          .single();

        if (error) {
          throw error;
        }

        setStory(data);
      } catch (err) {
        console.error("Error fetching story:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch story");
      } finally {
        setLoading(false);
      }
    };

    if (story_id) {
      fetchStory();
    }
  }, [story_id]);

  useEffect(() => {
    const root = document.body;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  useEffect(() => {
    const handleToggle = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsDark((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleToggle);
    return () => window.removeEventListener("keydown", handleToggle);
  }, []);

  useEffect(() => {
    if (audioRef.current && story?.poem_audio) {
      audioRef.current.play().catch((err) => {
        console.log("Audio autoplay failed:", err);
      });
    }
  }, [story]);

  const handlePoemClick = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.log("Audio playback failed:", err);
      });
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full min-h-screen">
        <SunlightBackground />
        <div className="sunlit-content flex items-center justify-center min-h-screen">
          <div className="text-xl text-gray-500">Loading story...</div>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="w-full h-full min-h-screen">
        <SunlightBackground />
        <div className="sunlit-content flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-xl text-red-500 mb-4">
              {error || "Story not found"}
            </div>
            <button
              onClick={() => router.push("/story")}
              className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Stories
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-screen">
      <SunlightBackground />
      <div className="sunlit-content">
        <motion.div
          className="container mx-auto px-8 py-8 max-w-5xl"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Back Button */}
          <button
            onClick={() => router.push("/story")}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            Back to Stories
          </button>

          {/* Title */}
          <motion.h1
            className="text-3xl lg:text-4xl xl:text-5xl font-bold text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {story.title}
          </motion.h1>

          {/* Comic Image Section - Main Focus */}
          {story.comic_image && (
            <motion.div
              className="mb-8 relative group max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="aspect-[4/3] bg-white rounded-xl overflow-hidden shadow-lg relative">
                {/* Comic Image */}
                <img
                  src={story.comic_image}
                  alt={`${story.title} - Comic`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.backgroundColor = "#f0f0f0";
                  }}
                />

                {/* Camera Image Overlay - Shown on Hover */}
                {story.camera_image && (
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <img
                      src={story.camera_image}
                      alt={`${story.title} - Camera`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.backgroundColor = "#f0f0f0";
                      }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Poem Section */}
          {story.poem_text && (
            <motion.div
              className="text-center mb-4 cursor-pointer hover:opacity-80 transition-opacity"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onClick={handlePoemClick}
              title="Click to replay audio"
            >
              <div className="prose prose-lg max-w-none">
                <p
                  className="whitespace-pre-wrap text-gray-800 leading-relaxed text-xl lg:text-2xl xl:text-3xl"
                  style={{ fontFamily: "'Times New Roman', Times, serif" }}
                >
                  {story.poem_text}
                </p>
              </div>
            </motion.div>
          )}

          {/* Hidden Audio Player */}
          {story.poem_audio && (
            <audio ref={audioRef} src={story.poem_audio} className="hidden" />
          )}
        </motion.div>
      </div>
    </div>
  );
}
