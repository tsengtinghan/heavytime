import Image from "next/image";
import WeekView from "./components/WeekView";
import SunlightBackground from "./components/SunlightBackground";

export default function Home() {
  return (
    <div className="w-full h-full">
      <SunlightBackground />
      <div className="sunlit-content">
        <WeekView />
      </div>
    </div>
  );
}
