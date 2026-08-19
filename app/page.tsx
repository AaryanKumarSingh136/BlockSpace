export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-4">
      <div className="max-w-2xl text-center">
        <div className="mb-8 inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-sm font-medium">
          Modern resource & event management
        </div>
        
        <h1 className="text-7xl md:text-8xl font-black tracking-tighter mb-6 bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-600 bg-clip-text text-transparent">
          Blockspace
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
          Centralize resource bookings, manage multi-tenant events, and scale your organization with real-time collaboration.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href="/sign-in" 
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl transition duration-200 shadow-lg shadow-indigo-600/40 hover:shadow-indigo-600/60"
          >
            Sign In
          </a>
          <a 
            href="/sign-up" 
            className="px-8 py-4 border border-indigo-500/50 text-white font-bold rounded-xl hover:bg-indigo-500/10 transition duration-200"
          >
            Get Started Free
          </a>
        </div>
        
        <p className="mt-12 text-gray-400 text-sm">
          No credit card required. Start managing instantly.
        </p>
      </div>
    </main>
  );
}