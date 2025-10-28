"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase, Story } from "@/lib/supabase";
import Link from "next/link";
import SunlightBackground from "../components/SunlightBackground";
import NavBar from "../components/NavBar";

export default function StoryListPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("story")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        setStories(data || []);
      } catch (err) {
        console.error("Error fetching stories:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch stories"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

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

  return (
    <div className="w-full h-full min-h-screen">
      <NavBar />
      <SunlightBackground />
      <div className="sunlit-content pt-16">
        <motion.div
          className="container mx-auto px-8 py-16"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1 className="text-5xl font-bold text-center mb-12">Stories</h1>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-xl text-gray-500">Loading stories...</div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-xl text-red-500">Error: {error}</div>
            </div>
          ) : stories.length === 0 ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-xl text-gray-500">No stories yet</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {stories.map((story, index) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                >
                  <Link href={`/story/${story.id}`}>
                    <div className="group cursor-pointer">
                      <div className="aspect-[4/3] bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 mb-4">
                        {story.camera_image ? (
                          <img
                            src={story.camera_image}
                            alt={story.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.style.backgroundColor = "#f0f0f0";
                              e.currentTarget.src =
                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23f0f0f0' width='400' height='300'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='18' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3EImage not found%3C/text%3E%3C/svg%3E";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                            No image
                          </div>
                        )}
                      </div>
                      <h2 className="text-2xl font-semibold text-center group-hover:text-blue-600 transition-colors">
                        {story.title}
                      </h2>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
