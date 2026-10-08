// Sao đánh giá THẬT: chỉ hiện khi sản phẩm có đánh giá đã duyệt.
// Không hiện 5 sao mặc định — tránh thông tin gây hiểu nhầm cho khách.
export default function RatingStars({
  avg,
  count,
  showCount = true,
  className = '',
}: {
  avg?: number;
  count?: number;
  showCount?: boolean;
  className?: string;
}) {
  if (!count || !avg) return null;
  const full = Math.round(avg);
  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`}
      aria-label={`${avg.toFixed(1)} trên 5 sao, ${count} đánh giá`}
    >
      <span className="tracking-tight text-amber-500" aria-hidden>
        {'★'.repeat(full)}
        <span className="text-zinc-300">{'★'.repeat(5 - full)}</span>
      </span>
      {showCount && (
        <span className="text-zinc-500" aria-hidden>
          ({count})
        </span>
      )}
    </span>
  );
}
