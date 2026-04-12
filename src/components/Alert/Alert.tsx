// components/Toast.tsx
import { useEffect } from "react";

interface ToastProps {
  message: string;
  show: boolean;
  closeAlert: () => void;
  duration?: number; // auto-dismiss in ms, default 3000
  isError?: boolean; // whether this is an error toast
}

const Toast: React.FC<ToastProps> = ({
  message,
  show,
  closeAlert,
  duration = 5000,
  isError = false,
}) => {
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(closeAlert, duration);
    return () => clearTimeout(timer);
  }, [show]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-[2500] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg
        bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
        transition-all duration-300 ease-in-out
        ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
    >
      <span className="text-sm text-gray-700 dark:text-gray-300 flex flex-row gap-2 items-center">
        {isError && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width={12}
            height={12}
          >
            <line
              x1="4"
              y1="4"
              x2="20"
              y2="20"
              stroke="#E24B4A"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <line
              x1="20"
              y1="4"
              x2="4"
              y2="20"
              stroke="#E24B4A"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        )}
        {message}
      </span>
      <button
        onClick={closeAlert}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none"
      >
        ✕
      </button>
    </div>
  );
};

export default Toast;
