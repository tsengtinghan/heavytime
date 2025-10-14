import Image from "next/image";
import WeekView from "./components/WeekView";

export default function Home() {
  return (
    <div className="w-full h-full">
      <WeekView />
    </div>
  );
}
