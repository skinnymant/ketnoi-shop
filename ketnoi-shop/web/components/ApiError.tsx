export default function ApiError() {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-6 text-sm leading-relaxed text-amber-800">
      Không kết nối được tới API (<code className="rounded bg-amber-100 px-1">
        localhost:4000
      </code>
      ). Hãy chạy <code className="rounded bg-amber-100 px-1">npm run start:dev</code>{' '}
      trong thư mục <code className="rounded bg-amber-100 px-1">api</code> và đảm
      bảo đã seed dữ liệu (<code className="rounded bg-amber-100 px-1">
        npx prisma db seed
      </code>
      ).
    </div>
  );
}
