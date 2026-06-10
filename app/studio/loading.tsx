export default function StudioLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-screen-xl mx-auto px-3 sm:px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo placeholder */}
            <div className="h-9 w-36 bg-gray-100 rounded-lg animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse hidden sm:block" />
            <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse hidden sm:block" />
            <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse sm:hidden" />
          </div>
        </div>
      </header>
      <main className="max-w-screen-xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_340px] gap-4 items-start">
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm h-28 animate-pulse" />
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm h-40 animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm h-32 animate-pulse" />
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm h-80 animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm h-48 animate-pulse" />
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm h-64 animate-pulse" />
          </div>
        </div>
      </main>
    </div>
  );
}
