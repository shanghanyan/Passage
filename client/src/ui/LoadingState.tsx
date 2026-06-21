interface LoadingStateProps {
  title: string;
  subtitle?: string;
  /** inline = compact row; panel = centered card; overlay = full-screen dim */
  variant?: "inline" | "panel" | "overlay";
  className?: string;
}

export function LoadingState({
  title,
  subtitle,
  variant = "panel",
  className = "",
}: LoadingStateProps) {
  return (
    <div
      className={`loading-state loading-state--${variant} ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="loading-state__spinner" aria-hidden />
      <div className="loading-state__text rise-in">
        <p className="loading-state__title">{title}</p>
        {subtitle && <p className="loading-state__subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}
