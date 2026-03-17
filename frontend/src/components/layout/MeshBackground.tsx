export function MeshBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-200 rounded-full blur-3xl opacity-30 animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-dealer-100 rounded-full blur-3xl opacity-30 animate-pulse" />
    </div>
  );
}
