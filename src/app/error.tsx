'use client';
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <main className="grid min-h-screen place-items-center bg-[#fff9fc] px-6 text-center text-[#352331]"><div><h1 className="font-serif text-3xl">Something went wrong</h1><p className="mx-auto mt-3 max-w-sm text-sm text-[#6b5360]">Please try again. Your bag is safe.</p><button onClick={reset} className="mt-6 min-h-12 rounded-full bg-[#a83c70] px-8 text-sm font-semibold text-white">Try again</button></div></main>;
}
