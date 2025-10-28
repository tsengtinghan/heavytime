import Image from "next/image";
import WeekView from "./components/WeekView";
import SunlightBackground from "./components/SunlightBackground";
import NavBar from "./components/NavBar";

export default function Home() {
  return (
    <div className="w-full h-full">
      <NavBar />
      <SunlightBackground />
      <div className="sunlit-content pt-16">
        <WeekView />
      </div>
    </div>
  );
}
