# Icon thương hiệu SWE

Logo được tạo bằng công cụ tạo ảnh tích hợp, dựa trên màu teal và chữ SWE đã có trên website. Bản được chọn dùng nền kín để giữ độ rõ ở kích thước nhỏ. Các bản PNG/ICO chỉ được đổi kích thước và định dạng bằng Sharp, không chỉnh nội dung logo.

Tệp dùng trong dự án:

- `ketnoi-shop/web/public/brand/swe-logo.png`: logo PNG 512×512 để dùng lại.
- `ketnoi-shop/web/app/icon.png`: icon trình duyệt 512×512.
- `ketnoi-shop/web/app/apple-icon.png`: icon Apple 180×180.
- `ketnoi-shop/web/app/favicon.ico`: các khung 16, 32, 48, 64 và 256 px.

Next.js tự tạo liên kết icon theo quy ước tệp, không cần thêm metadata trùng lặp. Liên kết PNG có mã phiên bản để giúp trình duyệt nhận bản mới.

Prompt cuối đã sử dụng:

> Create ONE clean production brand favicon, square 1024x1024, for SWE industrial tools website. Entire image must be an opaque, perfectly uniform solid teal background #087F7A, edge to edge. Center exact uppercase text "SWE" in pure white, extremely bold condensed geometric sans-serif, straight upright letters, crisp simple flat shapes. Three letters are very large, fill 86% of width and about 48% of height, with even spacing and equal left/right margins. All background pixels must stay solid teal, with NO holes, cutouts, speckles, glow, gradient, shadow, texture or distressed edges. White letters should have clean sharp solid edges. Flat minimal two-color logo only, intended to be legible at 16x16 and 32x32. No other words, no logo mockup, no frame, no border, no tools, no decorative objects. Opaque square canvas.
