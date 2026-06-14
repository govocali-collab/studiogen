export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance en cours</h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            StudioGen est temporairement hors ligne pour une mise à jour.<br />
            Nous serons de retour très bientôt.
          </p>
        </div>
        <p className="text-xs text-gray-400">© StudioGen — NexusLocale</p>
      </div>
    </div>
  );
}
