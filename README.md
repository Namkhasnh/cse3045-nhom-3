# Hoa Lac Food Ordering Platform

Nền tảng khám phá món ăn và đặt món dành cho sinh viên Hòa Lạc, triển khai đầu tiên tại VJU.
Yêu cầu sản phẩm: [docs/requirements.md](docs/requirements.md).

Documentation map: [docs/README.md](docs/README.md). AI contributor instructions: [AGENTS.md](AGENTS.md).

The repository contains backend accounts/authentication and frontend auth/profile routes. Student restaurant discovery still uses explicitly labeled fixtures; connected ordering workflows are not implemented.

## Công nghệ hiện có

- Frontend: Vite, React, TypeScript, Tailwind CSS 4, self-hosted Be Vietnam Pro.
- Backend: NestJS, TypeScript, REST; global validation và cấu hình môi trường.
- Database: MySQL qua Prisma và MariaDB adapter; quản lý kết nối theo vòng đời NestJS.
- CI: lint, build frontend; lint, unit test, E2E và build backend.

Student register/login/me/profile/logout use cookie JWT and CSRF. The frontend calls these endpoints and routes Student, Owner and Admin to separate layouts. Privileged account creation is an operator-only signed-manifest CLI; see [deployment §6](docs/deployment.md#6-first-admin-and-initial-partner-bootstrap).

## Chuẩn bị

Dùng Node.js 24 và npm để khớp môi trường CI. Cần MySQL đang chạy và một database đã được tạo.

```sh
cd backend
npm ci
[ -e .env ] || cp .env.example .env
```

Sửa `backend/.env` bằng thông tin MySQL, JWT/CSRF, `PUBLIC_ORIGIN` và các biến `SMTP_*` trong `.env.example`. Giữ file `.env` hiện có nếu đã cấu hình. SMTP cần thiết để gửi mã xác minh email thật khi đăng ký; dùng tài khoản gửi riêng và không đặt mật khẩu SMTP trong `VITE_*`.
`DATABASE_URL` có dạng `mysql://user:password@host:port/database`; mã hóa URL các ký tự đặc biệt trong thông tin đăng nhập.
Không đưa mật khẩu thật vào Git hoặc frontend.

Ví dụ cấu hình SMTP trong `backend/.env` (thay toàn bộ giá trị mẫu bằng thông tin nhà cung cấp của bạn):

```dotenv
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-account
SMTP_PASSWORD=your-app-password
SMTP_FROM="Hoa Lac Food <no-reply@example.com>"
```

`SMTP_FROM` cần là địa chỉ đã được dịch vụ SMTP cho phép gửi. Cổng 587 yêu cầu STARTTLS; cổng 465 dùng TLS ngay khi kết nối. Khởi động lại backend sau khi sửa `.env`. Không gửi các giá trị thật vào chat hoặc commit.

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
The current schema has `accounts`, `account_role_requests`, `audit_logs`, `auth_login_limits` and four migrations; order/finance models do not exist yet. The backend exposes registration, email verification/resend, login/me/logout, profile and Admin role-request review under `/api/v1`; `/` and `/todos` return 404. Backend startup requires MySQL and auth configuration.

## Chạy frontend

Mở terminal khác:

```sh
cd frontend
npm ci
npm run dev
```

Mở `/login` tại địa chỉ Vite in trong terminal (mặc định `http://localhost:5173/login`). Vite chuyển tiếp `/api` tới backend cổng 3000; `PUBLIC_ORIGIN` phải khớp origin của trình duyệt. `/preview` chỉ ở môi trường phát triển, bỏ qua `/auth/me` và xem được dữ liệu quán mẫu khi backend chưa chạy. Xem [hướng dẫn frontend](frontend/README.md).

In this local setup, registration writes to `cse3045.accounts`; an Owner/Admin selection also writes a pending row to `cse3045.account_role_requests`. The account starts as Student, cannot log in before email verification, and stores an Argon2id password hash rather than plaintext. The form requires a username, email and password confirmation. Admin approval is required before a requested Owner/Admin role takes effect. Registration does not populate restaurant fixtures. If the browser uses `127.0.0.1:5173`, its Origin will not match the configured `http://localhost:5173`.

## Kiểm tra

Trong `backend`:

```sh
npm run lint
npm test
npm run test:e2e
npm run build
```

Các HTTP E2E test mock Prisma. Ngày 17/10/2026, cả bốn migration đã áp dụng vào `cse3045`; migration mới và luồng xác minh/duyệt quyền đã qua kiểm tra trên container MySQL 8.4.11 tạm. `db:check` riêng lẻ chỉ kiểm tra kết nối. Phiên bản chuẩn vẫn là 8.4.11 theo [hợp đồng database](docs/data/database.md#1-authority-scope-and-implementation-boundary).

Trong `frontend`:

```sh
npm run lint
npm run build
```

## Phát triển tiếp

Lấy `docs/requirements.md` làm nguồn yêu cầu. Thêm module NestJS và model Prisma theo từng tính năng; tạo migration tiến cho thay đổi schema.
Không dùng reset database để dọn dữ liệu demo hoặc khởi tạo tính năng mới trên database có dữ liệu cần giữ.
