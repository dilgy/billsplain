"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Suggestion = {
  placeId: string;
  description: string;
};

// Prevent duplicate script loading
let googleLoading: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (window.google?.maps?.places) return Promise.resolve();
  if (googleLoading) return googleLoading;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!apiKey) return Promise.reject("No API key");

  googleLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject("Failed to load Google Maps");
    document.head.appendChild(script);
  });

  return googleLoading;
}

export default function AddressAutocomplete({
  value,
  onChange,
  className,
  placeholder,
  autoFocus,
}: {
  value: string;
  onChange: (address: string) => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [ready, setReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadGoogleMaps().then(() => setReady(true)).catch(console.error);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchSuggestions = useCallback(async (input: string) => {
    if (!ready || input.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    try {
      // Use the new AutocompleteSuggestion API
      const { suggestions: results } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input,
        includedRegionCodes: ["us"],
        includedPrimaryTypes: ["street_address", "subpremise", "premise"],
      });

      const mapped: Suggestion[] = results
        .filter((s) => s.placePrediction)
        .map((s) => ({
          placeId: s.placePrediction!.placeId,
          description: s.placePrediction!.text.toString(),
        }));

      setSuggestions(mapped);
      setShowDropdown(mapped.length > 0);
      setActiveIndex(-1);
    } catch (e) {
      console.error("Places autocomplete error:", e);
      setSuggestions([]);
      setShowDropdown(false);
    }
  }, [ready]);

  const handleChange = (val: string) => {
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSelect = (description: string) => {
    onChange(description);
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      e.stopPropagation();
      handleSelect(suggestions[activeIndex].description);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
        placeholder={placeholder}
        className={className}
        autoFocus={autoFocus}
        autoComplete="off"
      />
      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg overflow-hidden">
          {suggestions.map((s, i) => (
            <li
              key={s.placeId}
              onClick={() => handleSelect(s.description)}
              className={`px-4 py-3 text-[0.875rem] cursor-pointer transition-colors ${
                i === activeIndex
                  ? "bg-[rgba(180,83,9,0.08)] text-foreground"
                  : "text-[#57534e] hover:bg-[rgba(0,0,0,0.03)]"
              }`}
            >
              {s.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
