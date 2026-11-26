# Miku Game

Sàn thương mại điện tử game (Steam, PS4, PS5) - dự án học tập cá nhân.
Mọi giao dịch, giá bán và key game đều là **giả lập**, không có tiền hay key thật.

## Tính năng
- Trang chủ động: banner, flash sale đếm ngược, thẻ game nghiêng 3D
- Danh mục: lọc nền tảng/thể loại/giá, tìm kiếm gợi ý, phân trang
- Chi tiết game, so sánh giá theo nền tảng, thư viện ảnh
- Đăng ký/đăng nhập (JWT + cookie httpOnly), giỏ hàng, mã giảm giá, yêu thích
- Thanh toán giả lập: QR, MoMo, ZaloPay, VNPay, thẻ, PayPal, ví nội bộ
- Giữ key 15 phút, chống bán trùng, giao key tự động, hoàn tiền
- Trang quản trị: doanh thu, đơn hàng, kho key, giá và flash sale

## Công nghệ
Next.js, React, Tailwind CSS, Framer Motion, Prisma, SQLite, Zod, Vitest

## Chạy thử
    npm install
    cp .env.example .env      # điền JWT_SECRET, WEBHOOK_SECRET, RAWG_API_KEY
    npx prisma migrate dev
    npm run seed
    npm run import:rawg       # tùy chọn
    npm run dev

Tài khoản mẫu (chỉ dùng khi phát triển):
- admin@miku.com / admin1234567

## Ghi chú
Dữ liệu game từ [RAWG](https://rawg.io). Tên và nhãn Steam, PlayStation thuộc về chủ sở hữu.
Dự án không liên kết với Valve, Sony hay Crypton.