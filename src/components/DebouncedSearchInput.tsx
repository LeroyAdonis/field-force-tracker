import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DebouncedSearchInputProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

/**
 * Search input with built-in debounce and clear button.
 * Manages internal state for immediate feedback, debounces
 * the value before calling `onValueChange`.
 */
export function DebouncedSearchInput({
  value: controlledValue,
  onValueChange,
  placeholder = "Search…",
  debounceMs = 300,
  className,
}: DebouncedSearchInputProps) {
  const [internalValue, setInternalValue] = useState(controlledValue ?? "");
  const debouncedValue = useDebouncedValue(internalValue, debounceMs);

  // Sync debounced value to parent via effect (avoids render-phase side effects)
  useEffect(() => {
    onValueChange(debouncedValue);
  }, [debouncedValue, onValueChange]);

  // Sync external value changes into internal state
  useEffect(() => {
    if (controlledValue !== undefined && controlledValue !== internalValue) {
      setInternalValue(controlledValue);
    }
    // Only react to controlledValue changes, not internalValue
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlledValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value);
  };

  const handleClear = () => {
    setInternalValue("");
    onValueChange("");
  };

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="pl-9 pr-9"
      />
      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
