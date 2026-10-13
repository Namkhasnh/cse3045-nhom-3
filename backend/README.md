# Backend

NestJS + TypeScript, chỉ khởi động HTTP server; chưa có endpoint.

```sh
npm ci
npm run start:dev
```

Server mặc định ở `http://localhost:3000`. Đổi cổng bằng `PORT`:

```sh
PORT=3001 npm run start:dev
```

Request tới `/` trả `404` vì chưa có controller.

```sh
npm run build
npm run start:prod
```

## Kiểm tra code

```sh
npm run lint     # Kiểm tra code bằng ESLint
npm run lint:fix # Tự sửa những lỗi ESLint có thể sửa
```

Cấu hình trong `eslint.config.mjs` dùng bộ quy tắc recommended của ESLint
và typescript-eslint cho mã nguồn, test và file cấu hình JavaScript.
Các thư mục `node_modules/`, `dist/` và `.test-dist/` được bỏ qua.
Dependency được ghim phiên bản chính xác; TypeScript giữ ở `6.0.3`.

## Chạy test

```sh
npm test          # Kiểm tra module khởi tạo được
npm run test:e2e # Kiểm tra server HTTP trả 404 khi chưa có API
```

Test dùng `@nestjs/testing` để dựng ứng dụng và `node:test` để chạy test.
TypeScript được biên dịch vào `.test-dist/` trước khi chạy. Test HTTP tự
chọn cổng trống và đóng server sau khi chạy, không chiếm cổng 3000.
Khi thêm API, cập nhật test tương ứng với hành vi mới.

## Cấu trúc backend

| File/thư mục | Vai trò |
| --- | --- |
| `src/main.ts` | Điểm khởi động: tạo ứng dụng NestJS và mở cổng `PORT`, mặc định `3000`. |
| `src/app.module.ts` | Module gốc: nơi đăng ký các module, controller và service khi thêm chức năng. |
| `src/app.module.spec.ts` | Test module: kiểm tra NestJS dựng và khởi tạo module gốc được. |
| `test/app.e2e-spec.ts` | Test HTTP: chạy server thật và kiểm tra phản hồi qua request. |
| `nest-cli.json` | Cấu hình Nest CLI: thư mục mã nguồn và quá trình build. |
| `eslint.config.mjs` | Quy tắc kiểm tra code JavaScript/TypeScript bằng ESLint. |
| `tsconfig.json` | Cấu hình TypeScript chung, gồm decorator và kiểu module. |
| `tsconfig.build.json` | Cấu hình build ứng dụng; loại test khỏi bản build. |
| `tsconfig.test.json` | Cấu hình biên dịch mã nguồn và test vào `.test-dist/`. |
| `package.json` | Khai báo dependency và các lệnh chạy, build, test. |
| `package-lock.json` | Khóa cây dependency để `npm ci` cài lại đúng phiên bản. |
| `.gitignore` | Loại dependency, kết quả build/test và file môi trường khỏi Git. |
| `.gitattributes` | Chuẩn hóa ký tự xuống dòng cho Git. |
| `README.md` | Hướng dẫn chạy và giải thích cấu trúc. |
| `node_modules/` | Dependency do npm cài; không sửa trực tiếp. |
| `dist/` | JavaScript sinh ra từ `npm run build`, dùng khi chạy production. |
| `.test-dist/` | JavaScript sinh ra để chạy test; không đưa lên Git. |

Chưa có `app.controller.ts` (nhận request và định nghĩa API) hay
`app.service.ts` (xử lý nghiệp vụ), vì backend hiện chỉ mở server.
