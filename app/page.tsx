import Header from "@/components/Header";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative h-screen w-screen bg-gradient-to-br from-green-100 to-green-200">
      {/* Header */}
      <Header />

      {/* Hero Section Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Title */}
        <h1 className="w-full text-center py-4 text-8xl text-black/80 font-raleway">
          ECOBOUNTY
        </h1>

        {/* CTA Button */}
        <div className="mt-6 flex justify-center">
          <Link href="/signup">
          <button className="px-8 py-4 bg-green-600 text-white rounded-lg text-2xl font-semibold hover:bg-green-700 transition">
            Start your EcoBounty Journey
          </button>
          </Link>
        </div>

        {/* Subtitle */}
        <h2 className="absolute bottom-10 w-full text-center text-2xl text-black/70 font-raleway px-4">
          Take Action Today for a Cleaner Tomorrow.
        </h2>
      </div>
    </div>
  );
}
