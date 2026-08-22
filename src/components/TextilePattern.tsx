// START GENAI
// Decorative saree-inspired paisley/border motif, built as SVG rather than a photo
// since we don't have a licensed image source to pull from.
export function TextilePattern({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern id="paisley" width="50" height="50" patternUnits="userSpaceOnUse">
          <path
            d="M25 10 C40 10 45 25 35 32 C28 37 28 42 33 42 C42 42 46 32 46 25 C46 15 38 5 25 5 C12 5 4 15 4 27 C4 38 12 45 20 45"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.5"
          />
        </pattern>
      </defs>
      <rect width="200" height="200" fill="url(#paisley)" />
    </svg>
  );
}
// END GENAI
