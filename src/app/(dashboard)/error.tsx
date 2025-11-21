"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="page-container">
      <div className="content-container space-y-4">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground">A client error occurred. Try again.</p>
        <button className="inline-flex items-center rounded-md border px-3 py-2 text-sm" onClick={() => reset()}>
          Retry
        </button>
      </div>
    </div>
  );
}
