# Hoa Lac Food Ordering Platform

Nền tảng khám phá món ăn và đặt món dành cho sinh viên Hòa Lạc, triển khai đầu tiên tại VJU.
Yêu cầu sản phẩm: [docs/requirements.md](docs/requirements.md).

Documentation map: [docs/README.md](docs/README.md). AI contributor instructions: [AGENTS.md](AGENTS.md).

Repo hiện là bộ khung kỹ thuật, chưa triển khai nghiệp vụ. CRUD todo thử nghiệm đã được gỡ.

## Công nghệ hiện có

- Frontend: Vite, React, TypeScript.
- Backend: NestJS, TypeScript, REST; global validation và cấu hình môi trường.
- Database: MySQL qua Prisma và MariaDB adapter; quản lý kết nối theo vòng đời NestJS.
- CI: lint, build frontend; lint, unit test, E2E và build backend.

Tailwind CSS, JWT và các module nghiệp vụ sẽ được bổ sung theo yêu cầu sản phẩm.

## Chuẩn bị

Dùng Node.js 24 và npm để khớp môi trường CI. Cần MySQL đang chạy và một database đã được tạo.

```sh
cd backend
npm ci
cp .env.example .env
```

Sửa `backend/.env` bằng thông tin MySQL của bạn. Giữ file `.env` hiện có nếu đã cấu hình.
`DATABASE_URL` có dạng `mysql://user:password@host:port/database`; mã hóa URL các ký tự đặc biệt trong thông tin đăng nhập.
Không đưa mật khẩu thật vào Git hoặc frontend.

## Chạy backend

Trong thư mục `backend`:

```sh
npm run prisma:validate
npm run db:check
npm run dev
```

Backend mặc định dùng cổng 3000, có thể đổi bằng `PORT`.
`db:check` build backend rồi chạy `SELECT 1`, không cần bảng nghiệp vụ.
Prisma Client được sinh tự động trước build, dev, start và biên dịch test.
Schema hiện chỉ giữ cấu hình generator và datasource; chưa có model nghiệp vụ.
Chưa có endpoint ứng dụng; `/` và `/todos` trả về 404. Backend cần kết nối MySQL để khởi động.

## Chạy frontend

Mở terminal khác:

```sh
cd frontend
npm ci
npm run dev
```

Mở địa chỉ Vite in trong terminal (mặc định `http://localhost:5173`).
Frontend hiện là trang giới thiệu tối giản, chưa gọi API; cấu hình API URL, proxy hoặc CORS sẽ được bổ sung cùng tính năng đầu tiên cần kết nối FE–BE.

## Kiểm tra

Trong `backend`:

```sh
npm run lint
npm test
npm run test:e2e
npm run build
```

Các test nền mock kết nối DB; dùng `npm run db:check` để kiểm tra MySQL thật.

Trong `frontend`:

```sh
npm run lint
npm run build
```

## Phát triển tiếp

Lấy `docs/requirements.md` làm nguồn yêu cầu. Thêm module NestJS và model Prisma theo từng tính năng; tạo migration đầu tiên khi có schema nghiệp vụ.
Không dùng reset database để dọn dữ liệu demo hoặc khởi tạo tính năng mới trên database có dữ liệu cần giữ.
