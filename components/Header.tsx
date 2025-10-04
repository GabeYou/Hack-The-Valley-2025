"use client";
import Link from "next/link";
import EnergySavingsLeafIcon from "@mui/icons-material/EnergySavingsLeaf";


function Icon() {
    return <EnergySavingsLeafIcon className="text-green-600" fontSize="large" />;
  }


export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white shadow">
      <div className="w-full px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-black">
            <Icon />
            EcoBounty
        </Link>

        {/* Nav / CTA */}
        <div className="flex items-center gap-4">
          <Link
            href="/signup"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Register
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition"
          >
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
}
