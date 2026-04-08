export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#080808]">
      <div className="flex flex-col items-center gap-6">
        <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-white animate-spin" />
        <div className="flex flex-col gap-3 w-64">
          <div className="h-4 bg-white/10 rounded-full animate-pulse" />
          <div className="h-4 bg-white/10 rounded-full animate-pulse w-4/5 mx-auto" />
          <div className="h-4 bg-white/10 rounded-full animate-pulse w-3/5 mx-auto" />
        </div>
      </div>
    </div>
  )
}
