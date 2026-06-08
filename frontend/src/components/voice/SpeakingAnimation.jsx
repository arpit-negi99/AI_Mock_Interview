export function SpeakingAnimation() {
  return (
    <div className="flex h-10 items-end gap-1" aria-label="AI speaking">
      {[18, 30, 22, 36, 24].map((height, index) => (
        <span key={index} className="w-2 animate-pulse rounded-full bg-teal-500" style={{ height }} />
      ))}
    </div>
  );
}
