export default function Loading() {
  return (
    <div className="relative w-10 h-10">
      <div className="absolute inset-0 border-2 border-t-transparent border-blue-400 rounded-full animate-spin"></div>
      <div className="absolute inset-2 border-2 border-b-transparent border-blue-500 rounded-full animate-spin [animation-duration:1.5s]"></div>
    </div>
  );
}
