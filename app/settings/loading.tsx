export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="h-9 w-36 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <div>
          <div className="h-8 w-56 bg-gray-200 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-80 bg-gray-100 rounded animate-pulse" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
          </div>
          <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
          <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-36 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </main>
    </div>
  );
}
