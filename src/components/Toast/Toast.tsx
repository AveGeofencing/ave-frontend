import { useEffect } from "react";

interface ToastItem {
  id: string;
  message: string;
  isError?: boolean;
}

interface ToastProps {
  toasts: ToastItem[];
  removeToast: (id: string) => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  toasts,
  removeToast,
  duration = 5000,
}) => {
  return (
    <div className="fixed bottom-6 right-6 z-[2500] flex flex-col gap-2 items-end">
      {toasts
        .slice()
        .reverse()
        .map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            removeToast={removeToast}
            duration={duration}
          />
        ))}
    </div>
  );
};

const ToastItem: React.FC<{
  toast: ToastItem;
  removeToast: (id: string) => void;
  duration: number;
}> = ({ toast, removeToast, duration }) => {
  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id]);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg
        bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
        transition-all duration-300 ease-in-out opacity-100 translate-y-0"
    >
      <span className="text-sm text-gray-700 dark:text-gray-300 flex flex-row gap-2 items-center">
        {toast.isError && (
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
        {toast.message}
      </span>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none"
      >
        ✕
      </button>
    </div>
  );
};

export default Toast;
