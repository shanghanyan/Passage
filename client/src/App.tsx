import { PassageApp } from "./ui/PassageApp";
import { DetectionTest } from "./ui/DetectionTest";

export default function App() {
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has("detection-test")) {
    return <DetectionTest />;
  }
  return <PassageApp />;
}
