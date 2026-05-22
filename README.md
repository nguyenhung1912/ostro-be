<div align="center">

<img src="./public/logo.svg" alt="Ostro Logo" width="120" />

# OSTRO BACKEND

### Secure • Scalable • Real-time • AI Powered

<p align="center">
  High-performance RESTful API and WebSocket server powering the Ostro ecosystem.
</p>

<br/>

<img src="https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=node.js&logoColor=white" />
<img src="https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white" />
<img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
<img src="https://img.shields.io/badge/Socket.io-Realtime-black?style=for-the-badge&logo=socketdotio" />
<img src="https://img.shields.io/badge/JWT-Authentication-black?style=for-the-badge&logo=jsonwebtokens" />
<img src="https://img.shields.io/badge/Cloudinary-Media-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" />
<img src="https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white" />
<img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" />

<br/>
<br/>

<p align="center">
  <a href="#-english-documentation">🇺🇸 English</a>
  &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="#-tài-liệu-tiếng-việt">🇻🇳 Tiếng Việt</a>
</p>

</div>

---

# 🇺🇸 English Documentation

## 📖 Introduction

**Ostro Backend** is a powerful backend infrastructure designed to support real-time applications with scalability, security, and maintainability in mind.

Built with **Node.js**, **Express 5**, and **MongoDB**, the server provides a complete ecosystem for authentication, messaging, media handling, and AI-powered functionality.

---

## ✨ Core Features

<table>
<tr>
<td width="50%">

### 🔐 Authentication & Security

- JWT authentication
- Google OAuth 2.0 login
- Secure password hashing with bcrypt
- Protected route middleware

</td>
<td width="50%">

### 💬 Real-time Communication

- WebSocket server powered by Socket.io
- Live messaging system
- Real-time event broadcasting

</td>
</tr>

<tr>
<td width="50%">

### ☁️ Cloud File Upload

- Cloudinary media storage
- Multer file handling
- Optimized media delivery

</td>
<td width="50%">

### 🤖 AI Integration

- Google Gemini integration
- AI-powered capabilities
- Extensible AI service layer

</td>
</tr>

<tr>
<td width="50%">

### 🗄️ Database Architecture

- MongoDB database
- Mongoose ODM
- Structured schema management

</td>
<td width="50%">

### 🧩 Scalable Architecture

- Modular folder structure
- Clean separation of concerns
- Maintainable service-oriented design

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

<div align="center">

| Layer               | Technologies                                      |
| ------------------- | ------------------------------------------------- |
| **Backend Runtime** | Node.js                                           |
| **Framework**       | Express v5 (ES Modules)                           |
| **Database**        | MongoDB • Mongoose                                |
| **Authentication**  | JWT • bcrypt • Google Auth Library                |
| **Real-time**       | Socket.io                                         |
| **File Upload**     | Multer • Cloudinary                               |
| **AI Integration**  | Google Gemini • @google/genai                     |
| **Developer Tools** | Nodemon • ESLint • Prettier • Husky • Lint-staged |

</div>

---

## 📂 Project Structure

```bash
ostro-be/
│
├── src/
│   ├── controllers/            # Request handlers
│   ├── libs/                   # Library configurations
│   ├── middlewares/            # Express middlewares
│   ├── models/                 # Database schemas
│   ├── routes/                 # API route definitions
│   ├── services/               # Business logic & external services
│   ├── socket/                 # Socket.io event handlers
│   ├── utils/                  # Utility helper functions
│   └── server.js               # Application entry point
│
├── .env
├── .eslintrc.js
├── .prettierrc
├── package.json
└── README.md
```

---

# 🚀 Getting Started

## 📋 Prerequisites

Ensure the following tools are installed before starting:

| Tool    | Recommended Version |
| ------- | ------------------- |
| Node.js | v20+                |
| MongoDB | Latest              |
| pnpm    | Latest              |
| Git     | Latest              |

---

## ⚙️ Installation

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-org/ostro-be.git
cd ostro-be
```

---

### 2️⃣ Install Dependencies

```bash
pnpm install
```

---

### 3️⃣ Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=5000

# Database
MONGODB_URI=your_mongodb_connection

# Authentication
JWT_SECRET=your_secret_key
GOOGLE_CLIENT_ID=your_google_client_id

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI
GEMINI_API_KEY=your_gemini_api_key
```

> ⚠️ Never commit `.env` files to source control.

---

### 4️⃣ Start Development Server

```bash
pnpm dev
```

The server will start with Nodemon and automatically reload on file changes.

---

## 📜 Available Scripts

| Command         | Description                            |
| --------------- | -------------------------------------- |
| `pnpm dev`      | Start development server using Nodemon |
| `pnpm start`    | Start production server                |
| `pnpm lint`     | Run ESLint checks                      |
| `pnpm lint:fix` | Automatically fix lint issues          |
| `pnpm format`   | Format code with Prettier              |

---

## 🔌 Main Integrations

| Service       | Purpose                  |
| ------------- | ------------------------ |
| MongoDB       | Primary database         |
| Socket.io     | Real-time communication  |
| Cloudinary    | Media storage & delivery |
| Google OAuth  | Authentication           |
| Google Gemini | AI-powered services      |

---

# 🏗️ Architecture Overview

## 📦 Layered Structure

```text
Routes → Controllers → Services → Database
```

### Responsibilities

| Layer       | Responsibility                  |
| ----------- | ------------------------------- |
| Routes      | API endpoint definitions        |
| Controllers | Request & response handling     |
| Services    | Business logic                  |
| Models      | Database schema management      |
| Middlewares | Authentication & error handling |
| Socket      | Real-time communication         |

---

# 🧪 Development Workflow

## 🧹 Code Quality

This project maintains high code quality standards using:

- ESLint
- Prettier
- Husky
- Lint-staged
- Modular architecture
- Consistent code conventions

---

## 🌿 Git Branch Naming

```bash
feature/your-feature
fix/your-bug
refactor/your-module
```

---

## 🤝 Contributing

Contributions are welcome.

### Contribution Workflow

1. Fork the repository
2. Create a new feature branch
3. Write clean and maintainable code
4. Run lint checks
5. Submit a Pull Request

---

# 📄 License

This project is licensed under the **MIT License**.

See the `LICENSE` file for more information.

---

<div align="center">

### ⭐ Built with modern backend technologies and scalable architecture

</div>

---

<br/>
<br/>

# 🇻🇳 Tài liệu Tiếng Việt

## 📖 Giới thiệu

**Ostro Backend** là hệ thống backend mạnh mẽ được thiết kế để hỗ trợ các ứng dụng realtime với khả năng mở rộng cao, bảo mật tốt và dễ bảo trì.

Được xây dựng bằng **Node.js**, **Express 5** và **MongoDB**, hệ thống cung cấp đầy đủ các chức năng từ xác thực người dùng, nhắn tin realtime, xử lý media đến tích hợp AI.

---

## ✨ Tính năng nổi bật

<table>
<tr>
<td width="50%">

### 🔐 Xác thực & bảo mật

- JWT Authentication
- Đăng nhập Google OAuth 2.0
- Mã hóa mật khẩu với bcrypt
- Middleware bảo vệ route

</td>
<td width="50%">

### 💬 Giao tiếp thời gian thực

- WebSocket server với Socket.io
- Hệ thống nhắn tin realtime
- Broadcast sự kiện trực tiếp

</td>
</tr>

<tr>
<td width="50%">

### ☁️ Upload file lên cloud

- Lưu trữ media bằng Cloudinary
- Xử lý upload với Multer
- Tối ưu phân phối media

</td>
<td width="50%">

### 🤖 Tích hợp AI

- Kết nối Google Gemini
- Các tính năng hỗ trợ AI
- Kiến trúc AI service mở rộng

</td>
</tr>

<tr>
<td width="50%">

### 🗄️ Kiến trúc cơ sở dữ liệu

- MongoDB database
- Mongoose ODM
- Quản lý schema rõ ràng

</td>
<td width="50%">

### 🧩 Kiến trúc mở rộng tốt

- Cấu trúc module rõ ràng
- Phân tách trách nhiệm hợp lý
- Thiết kế dễ bảo trì

</td>
</tr>
</table>

---

## 🛠️ Công nghệ sử dụng

<div align="center">

| Thành phần             | Công nghệ                                         |
| ---------------------- | ------------------------------------------------- |
| **Backend Runtime**    | Node.js                                           |
| **Framework**          | Express v5 (ES Modules)                           |
| **Database**           | MongoDB • Mongoose                                |
| **Xác thực**           | JWT • bcrypt • Google Auth Library                |
| **Realtime**           | Socket.io                                         |
| **Upload file**        | Multer • Cloudinary                               |
| **AI Integration**     | Google Gemini • @google/genai                     |
| **Công cụ phát triển** | Nodemon • ESLint • Prettier • Husky • Lint-staged |

</div>

---

## 📂 Cấu trúc dự án

```bash
ostro-be/
│
├── src/
│   ├── controllers/            # Xử lý request từ client
│   ├── libs/                   # Cấu hình thư viện
│   ├── middlewares/            # Middleware Express
│   ├── models/                 # Schema cơ sở dữ liệu
│   ├── routes/                 # Định nghĩa API routes
│   ├── services/               # Logic nghiệp vụ
│   ├── socket/                 # Xử lý Socket.io
│   ├── utils/                  # Hàm tiện ích
│   └── server.js               # Điểm khởi động ứng dụng
│
├── .env
├── .eslintrc.js
├── .prettierrc
├── package.json
└── README.md
```

---

# 🚀 Bắt đầu sử dụng

## 📋 Yêu cầu hệ thống

Đảm bảo đã cài đặt các công cụ sau:

| Công cụ | Phiên bản khuyến nghị |
| ------- | --------------------- |
| Node.js | v20+                  |
| MongoDB | Mới nhất              |
| pnpm    | Mới nhất              |
| Git     | Mới nhất              |

---

## ⚙️ Cài đặt

### 1️⃣ Clone repository

```bash
git clone https://github.com/your-org/ostro-be.git
cd ostro-be
```

---

### 2️⃣ Cài đặt dependencies

```bash
pnpm install
```

---

### 3️⃣ Cấu hình biến môi trường

Tạo file `.env` tại thư mục gốc:

```env
# Server
PORT=5000

# Database
MONGODB_URI=your_mongodb_connection

# Authentication
JWT_SECRET=your_secret_key
GOOGLE_CLIENT_ID=your_google_client_id

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI
GEMINI_API_KEY=your_gemini_api_key
```

> ⚠️ Không commit file `.env` lên repository.

---

### 4️⃣ Khởi chạy môi trường phát triển

```bash
pnpm dev
```

Server sẽ chạy bằng Nodemon và tự động reload khi có thay đổi trong code.

---

## 📜 Các script hỗ trợ

| Lệnh            | Chức năng                |
| --------------- | ------------------------ |
| `pnpm dev`      | Chạy development server  |
| `pnpm start`    | Chạy production server   |
| `pnpm lint`     | Kiểm tra lỗi ESLint      |
| `pnpm lint:fix` | Tự động sửa lỗi lint     |
| `pnpm format`   | Format code với Prettier |

---

## 🔌 Các tích hợp chính

| Dịch vụ       | Mục đích            |
| ------------- | ------------------- |
| MongoDB       | Cơ sở dữ liệu chính |
| Socket.io     | Giao tiếp realtime  |
| Cloudinary    | Lưu trữ media       |
| Google OAuth  | Xác thực người dùng |
| Google Gemini | Dịch vụ AI          |

---

# 🏗️ Tổng quan kiến trúc

## 📦 Cấu trúc phân tầng

```text
Routes → Controllers → Services → Database
```

### Vai trò từng tầng

| Tầng        | Vai trò                         |
| ----------- | ------------------------------- |
| Routes      | Định nghĩa endpoint API         |
| Controllers | Xử lý request/response          |
| Services    | Logic nghiệp vụ                 |
| Models      | Quản lý schema database         |
| Middlewares | Authentication & error handling |
| Socket      | Giao tiếp realtime              |

---

# 🧪 Quy trình phát triển

## 🧹 Chất lượng code

Dự án duy trì tiêu chuẩn code cao với:

- ESLint
- Prettier
- Husky
- Lint-staged
- Kiến trúc module rõ ràng
- Quy ước code nhất quán

---

## 🌿 Quy ước đặt tên branch

```bash
feature/ten-tinh-nang
fix/ten-loi
refactor/ten-module
```

---

## 🤝 Đóng góp

Mọi đóng góp đều được hoan nghênh.

### Quy trình đóng góp

1. Fork repository
2. Tạo branch tính năng mới
3. Viết code sạch và dễ bảo trì
4. Chạy kiểm tra lint
5. Tạo Pull Request

---

# 📄 Giấy phép

Dự án được phát hành theo giấy phép **MIT License**.

Xem file `LICENSE` để biết thêm thông tin.

---

<div align="center">

### ⭐ Xây dựng bằng công nghệ backend hiện đại và kiến trúc mở rộng mạnh mẽ

</div>
