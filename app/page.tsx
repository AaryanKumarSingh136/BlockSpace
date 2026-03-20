export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold tracking-tight">Blockspace</h1>
        <p className="mt-4 text-xl text-gray-400">
          Resource & event management for every organization.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <a href="/sign-in" className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition">
            Sign In
          </a>
          <a href="/sign-up" className="px-6 py-3 border border-white text-white font-semibold rounded-lg hover:bg-white hover:text-black transition">
            Get Started
          </a>
        </div>
      </div>
    </main>
  );
}