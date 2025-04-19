import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onIncrement?: () => void;
  onDecrement?: () => void;
  showNumberControls?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, showNumberControls, onIncrement, onDecrement, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const combinedRef = (node: HTMLInputElement) => {
      // Update both refs
      inputRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    // Prevent scroll from changing number input value
    React.useEffect(() => {
      const input = inputRef.current;
      if (!input || type !== 'number') return;

      const handleWheel = (e: WheelEvent) => {
        if (document.activeElement === input) {
          e.preventDefault();
        }
      };

      // Add event listeners
      input.addEventListener('wheel', handleWheel, { passive: false });

      // Cleanup
      return () => {
        input.removeEventListener('wheel', handleWheel);
      };
    }, [type]);

    return (
      <div className="relative">
        <input
          type={type}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            // Remove spinner buttons for number inputs
            type === 'number' && "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            showNumberControls && "pr-12",
            className
          )}
          ref={combinedRef}
          {...props}
        />
        {showNumberControls && type === 'number' && (
          <div className="absolute right-0 top-0 h-full flex flex-col">
            <button
              type="button"
              onClick={onIncrement}
              className="flex-1 px-2 border-l border-b border-input hover:bg-accent rounded-tr-md"
              tabIndex={-1}
            >
              <span className="sr-only">Increment</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m18 15-6-6-6 6"/>
              </svg>
            </button>
            <button
              type="button"
              onClick={onDecrement}
              className="flex-1 px-2 border-l border-input hover:bg-accent rounded-br-md"
              tabIndex={-1}
            >
              <span className="sr-only">Decrement</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }