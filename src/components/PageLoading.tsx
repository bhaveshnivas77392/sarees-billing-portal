// START GENAI
import { Spinner } from "@/components/Spinner";

export function PageLoading() {
  return (
    <div className="flex items-center justify-center gap-2 py-24 text-gray-400">
      <Spinner className="h-5 w-5" />
      <span>Loading...</span>
    </div>
  );
}
// END GENAI
