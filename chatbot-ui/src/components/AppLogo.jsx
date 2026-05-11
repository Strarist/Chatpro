const AppLogo = ({ size = "md" }) => {
  const sizeClasses = {
    sm: "h-7 w-7",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

  const iconClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg border border-blue-400/20 bg-[#081428] text-blue-300 shadow-sm shadow-blue-950/20 ${sizeClasses[size]}`}
    >
      <svg
        viewBox="0 0 24 24"
        className={iconClasses[size]}
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M13 3 6 13h5l-1 8 8-11h-5l1-7Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 6.5h2.5M16.5 17.5H19"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export default AppLogo;