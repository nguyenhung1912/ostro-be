# Ostro Backend (ostro-be)

🇬🇧 **English** | 🇻🇳 **Tiếng Việt**

## About / Giới thiệu

**[EN]** Ostro Backend is the robust RESTful API and WebSocket server that powers the Ostro application. Built with Node.js, Express 5, and MongoDB, it provides essential services including user authentication (JWT & Google OAuth), real-time messaging, file uploading to Cloudinary, and AI capabilities powered by Google Gemini.
**[VN]** Ostro Backend là máy chủ RESTful API và WebSocket mạnh mẽ hỗ trợ ứng dụng Ostro. Được xây dựng bằng Node.js, Express 5 và MongoDB, hệ thống cung cấp các dịch vụ cốt lõi bao gồm xác thực người dùng (JWT & Google OAuth), nhắn tin theo thời gian thực, tải tệp lên Cloudinary và các tính năng AI được hỗ trợ bởi Google Gemini.

## Tech Stack / Công nghệ sử dụng

- **Core:** Node.js, Express v5 (ES Modules)
- **Database:** MongoDB, Mongoose
- **Authentication & Security:** JWT (JSON Web Tokens), bcrypt, Google Auth Library
- **Real-time:** Socket.io
- **File Upload:** Multer, Cloudinary
- **AI Integration:** Google GenAI (@google/genai)
- **Other Tools:** Nodemon, ESLint, Prettier, Husky, Lint-staged

## Project Structure / Cấu trúc dự án

```text
ostro-be/
├── src/
│   ├── controllers/  # Request handlers / Xử lý các request từ client
│   ├── libs/         # Core library configurations / Cấu hình thư viện cốt lõi
│   ├── middlewares/  # Express middlewares (Auth, Error handling) / Các middleware của Express
│   ├── models/       # Mongoose database schemas / Lược đồ cơ sở dữ liệu Mongoose
│   ├── routes/       # API route definitions / Định nghĩa các endpoint API
│   ├── services/     # Business logic & external API calls / Logic nghiệp vụ và gọi API ngoài
│   ├── socket/       # Socket.io event handlers / Xử lý sự kiện Socket.io
│   ├── utils/        # Utility and helper functions / Các hàm tiện ích hỗ trợ
│   └── server.js     # Application entry point / Điểm khởi đầu của ứng dụng
```

## Getting Started / Hướng dẫn cài đặt

### Prerequisites / Yêu cầu hệ thống

- **Node.js**: v18+ (Recommended v20+)
- **MongoDB**: Local instance or MongoDB Atlas cluster / Chạy local hoặc sử dụng MongoDB Atlas
- **Package Manager**: pnpm (Recommended) or npm/yarn

### Installation / Cài đặt

**[EN]** 1. Clone the repository and navigate to the `ostro-be` directory.
**[VN]** 1. Clone kho lưu trữ và di chuyển đến thư mục `ostro-be`.

```bash
cd ostro-be
```

**[EN]** 2. Install dependencies.
**[VN]** 2. Cài đặt các thư viện phụ thuộc.

```bash
pnpm install
```

**[EN]** 3. Set up environment variables. Create a `.env` file in the root directory based on required variables:
**[VN]** 3. Thiết lập biến môi trường. Tạo file `.env` ở thư mục gốc dựa trên các biến cần thiết:

```env
PORT=...
MONGODB_URI=...
JWT_SECRET=...
CLOUDINARY_URL=...
GOOGLE_CLIENT_ID=...
GEMINI_API_KEY=...
```

**[EN]** 4. Start the development server.
**[VN]** 4. Khởi chạy server phát triển.

```bash
pnpm run dev
```

**[EN]** The server will start via Nodemon and automatically reload on code changes.
**[VN]** Server sẽ khởi chạy qua Nodemon và tự động tải lại khi có thay đổi trong code.

## Scripts / Các lệnh có sẵn

- `pnpm dev`: Start the server in development mode using Nodemon / Khởi chạy server ở chế độ dev bằng Nodemon.
- `pnpm start`: Start the server in production mode / Khởi chạy server ở chế độ production.
- `pnpm lint`: Run ESLint to identify issues / Chạy ESLint để phát hiện lỗi.
- `pnpm lint:fix`: Automatically fix ESLint issues / Tự động sửa lỗi ESLint.

## Contributing / Đóng góp

**[EN]** Ensure you run formatters and linters before submitting a PR. Code must pass all ESLint and Prettier checks.
**[VN]** Đảm bảo bạn đã chạy các công cụ format và linter trước khi gửi PR. Code phải vượt qua các kiểm tra của ESLint và Prettier.
