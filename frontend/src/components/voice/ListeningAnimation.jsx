export function ListeningAnimation() {
  return (
    <div className="relative h-12 w-12 rounded-full bg-teal-100">
      <span className="absolute inset-2 animate-ping rounded-full bg-teal-400 opacity-60" />
      <span className="absolute inset-4 rounded-full bg-teal-600" />
    </div>
  );
}
