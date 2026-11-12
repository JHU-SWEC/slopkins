"use client";

import type { Basis } from "@/lib/nutrition";

// Per serving, or scaled to 100 g so different serving sizes compare fairly.
export function BasisToggle({
  basis,
  onChange,
  className = "",
}: {
  basis: Basis;
  onChange: (basis: Basis) => void;
  className?: string;
}) {
  const options: { value: Basis; label: string }[] = [
    { value: "serving", label: "Per serving" },
    { value: "100g", label: "Per 100 g" },
  ];
  return (
    <div role="group" aria-label="Nutrition basis" className={`flex rounded-md bg-gray-100 p-0.5 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={basis === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded px-2.5 py-1 text-sm font-medium transition ${
            basis === option.value ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-200"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
