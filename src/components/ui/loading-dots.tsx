export default function LoadingDots() {
  return (
    <div className="flex items-center justify-center space-x-1">
      <div className="w-1 h-1 bg-black rounded-full animate-bounce"></div>
      <div className="w-1 h-1 bg-black rounded-full animate-bounce [animation-delay:0.2s]"></div>
      <div className="w-1 h-1 bg-black rounded-full animate-bounce [animation-delay:0.4s]"></div>
    </div>
  );
}
