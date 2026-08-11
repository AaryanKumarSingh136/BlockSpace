import Link from 'next/link';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900/90 border border-gray-800 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-md">
        <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-8 h-8" />
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
          404 Error
        </span>

        <h1 className="text-3xl font-extrabold text-white mt-4 mb-2 tracking-tight">
          Page Not Found
        </h1>

        <p className="text-gray-400 text-sm mb-8">
          The page or resource you are looking for does not exist, was moved, or you don't have permission to access it.
        </p>

        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition"
          >
            <Home className="w-4 h-4" />
            Return to Dashboard
          </Link>

          <Link
            href="/"
            className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 border border-gray-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
