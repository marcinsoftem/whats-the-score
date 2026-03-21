export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#121212]">
      <div className="flex items-center gap-1.5 h-12">
        <div className="w-1 bg-white rounded-full h-6 loading-bar" style={{ animationDelay: '0s' }} />
        <div className="w-1 bg-white rounded-full h-6 loading-bar" style={{ animationDelay: '0.15s' }} />
        <div className="w-1 bg-white rounded-full h-6 loading-bar" style={{ animationDelay: '0.3s' }} />
        <div className="w-1 bg-white rounded-full h-6 loading-bar" style={{ animationDelay: '0.45s' }} />
        <div className="w-1 bg-white rounded-full h-6 loading-bar" style={{ animationDelay: '0.6s' }} />
      </div>
    </div>
  )
}
