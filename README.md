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

**Ostro Backend** is a modern and robust server-side architecture built with **Node.js (v22)**, **Express v5 (ES Modules)**, and **MongoDB**, designed to support high-performance real-time messaging, AI integrations, and administrative dashboards.

The server implements a state-of-the-art authentication flow, websocket communication, secure media handling, and advanced language models to offer features like summarization, task extraction, and translations.

> 📝 **API Swagger Documentation:** Once the server is running, you can access the interactive API Swagger documentation at [http://localhost:5001/api-docs/](http://localhost:5001/api-docs/)

---

## ✨ Core Features

<table>
<tr>
<td width="50%">

### 🔐 Authentication & Security

- JWT-based authentication with token cookie parsing.
- Secure refresh token rotation via `POST /api/auth/refresh`.
- Google OAuth 2.0 login integration.
- Secure password hashing using `bcrypt`.
- Custom Route Protection and Role Check middlewares.

</td>
<td width="50%">

### 💬 Real-time WebSockets

- Socket.io server with authorization middleware.
- Online/offline presence broadcasting via `online-users` event.
- Live direct and group messaging with automatic socket rooms.
- Real-time unread messages count updating.

</td>
</tr>

<tr>
<td width="50%">

### 🤖 AI Integration (Gemini 2.5)

- Powered by `@google/genai` using `gemini-2.5-flash`.
- **Summarization**: Condense recent chat history.
- **Task Extraction**: Automatically pull action items from conversation.
- **Title Generator**: Suggest names for group chats.
- **Message Writing Tone**: Improve drafts to be professional, shorter, friendlier, or clearer.
- **Translation**: Translate text between English and Vietnamese.

</td>
<td width="50%">

### 👑 Admin Moderation Panel

- Role-based route authorization (`admin` & `moderator`).
- User Management: Update roles, ban/unban, or delete accounts.
- Group Management: View all groups and delete inappropriate chats.
- Server Analytics: Tracks Daily Active Users (DAU), Monthly Active Users (MAU), message volumes, and registration growths.

</td>
</tr>

<tr>
<td width="50%">

### ☁️ Cloud File Uploads

- Integrated with Multer and Cloudinary storage.
- Supports secure user avatar and cover photo uploads.
- Supports inline message image attachments.
- Built-in file type validations and a strict 1MB size limit.

</td>
<td width="50%">

### 🤝 Friend & Conversation Systems

- Send, accept, decline, or cancel friend requests.
- Block lists and friendship status checks.
- Direct message and group chat creation, member adding, and group leaving.
- Message recall system with real-time socket updates.
- Conversation pinning and unpinning.

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

<div align="center">

| Layer                | Technologies                                   |
| :------------------- | :--------------------------------------------- |
| **Backend Runtime**  | Node.js v22 (ES Modules)                       |
| **Web Framework**    | Express v5.x                                   |
| **Database**         | MongoDB • Mongoose v9.x                        |
| **Real-time Engine** | Socket.io v4.x                                 |
| **AI SDK**           | Google GenAI SDK (`@google/genai` v2.4.x)      |
| **Authentication**   | JSON Web Tokens • Google Auth Library • bcrypt |
| **Media Handler**    | Multer • Cloudinary SDK                        |
| **API Docs**         | Swagger UI Express                             |
| **Code Quality**     | ESLint v10.x • Prettier • Husky • Lint-staged  |

</div>

---

## 📂 Project Structure

```bash
ostro-be/
│
├── .husky/                     # Git Hooks configurations
├── public/                     # Static resources
│   └── logo.svg                # Ostro Logo asset
│
├── src/
│   ├── controllers/            # Request handlers (auth, user, admin, message, conversation, AI)
│   ├── libs/                   # Library initializations (database connection)
│   ├── middlewares/            # Custom Express and Socket middlewares
│   ├── models/                 # Mongoose schemas (User, Conversation, Message, Friend, Session)
│   ├── routes/                 # API route declarations (auth, user, admin, messages, conversations, AI)
│   ├── services/               # Core services (aiService, authService, userService)
│   ├── socket/                 # Socket.io server configuration and connection handlers
│   ├── utils/                  # Utility helpers and validators
│   ├── server.js               # Main application entry point
│   └── swagger.json            # Swagger API documentation definition
│
├── .env                        # Local configuration environment variables (ignored in Git)
├── .gitignore                  # Git ignored files and directories
├── eslint.config.js            # ESLint modern flat config
├── package.json                # Project script commands and dependencies
├── pnpm-lock.yaml              # PNPM dependency lockfile
└── pnpm-workspace.yaml         # PNPM workspace configurations
```

---

# 🚀 Getting Started

## 📋 Prerequisites

Ensure the following environments are installed:

- **Node.js**: `v20.0.0` or higher
- **MongoDB**: Community Server local or Atlas Cloud Database
- **pnpm**: `v9.x` or higher

---

## ⚙️ Installation

### 1️⃣ Install Dependencies

From the workspace root or backend root, run:

```bash
pnpm install
```

---

### 2️⃣ Configure Environment Variables

Create a `.env` file in the `ostro-be` directory:

```env
# Server Config
PORT=5001

# Database Connection
MONGODB_CONNECTION_STRING=your_mongodb_connection_string

# Client URL (CORS and Socket.io)
CLIENT_URL=http://localhost:5173

# Authentication Security Secrets
ACCESS_TOKEN_SECRET=your_long_random_jwt_access_secret_key

# Cloudinary Config
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Google OAuth 2.0 Integration
GOOGLE_CLIENT_ID=your_google_oauth_client_id

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key
```

---

### 3️⃣ Start Development Server

Run the development server with automatic file reload:

```bash
pnpm dev
```

---

## 📜 Available Scripts

The following commands are defined in `package.json`:

| Command         | Description                                     |
| :-------------- | :---------------------------------------------- |
| `pnpm dev`      | Run backend in development mode with Nodemon    |
| `pnpm start`    | Run server in production mode                   |
| `pnpm lint`     | Analyze code styling and syntax using ESLint    |
| `pnpm lint:fix` | Automatically resolve autofixable ESLint issues |

---

# 🏗️ Architecture Overview

## 🔌 API Endpoints Reference

### 🔐 Authentication (`/api/auth`)

- `POST /signup` - Register a new account.
- `POST /signin` - Traditional credential login.
- `POST /google` - Exchange Google Token for local session.
- `POST /signout` - Clear session tokens.
- `POST /refresh` - Rotate Access Tokens using HTTP-only Refresh cookie.

### 👤 User Operations (`/api/users`)

- `GET /me` - Retrieve current logged-in profile.
- `PATCH /me` - Edit profile info.
- `PATCH /password` - Change account password.
- `DELETE /me` - Permanently deactivate and delete account.
- `GET /search` - Query registered users by username.
- `POST /uploadAvatar` - Upload profile avatar image to Cloudinary (1MB limit).
- `POST /uploadCover` - Upload profile cover photo to Cloudinary (1MB limit).

### 💬 Conversations & Messaging (`/api/conversations` & `/api/messages`)

- `GET /conversations` - Retrieve all conversations user is a part of.
- `POST /conversations` - Start a new direct conversation.
- `DELETE /conversations/:id` - Delete a chat conversation history.
- `PATCH /conversations/:id/rename` - Edit chat nickname or group name.
- `PATCH /conversations/:id/pin` - Toggle pin conversation on top.
- `PATCH /conversations/:id/add-members` - Invite users to a group conversation.
- `POST /conversations/:id/leave` - Leave a group conversation.
- `POST /messages/direct` - Send a direct message to a friend.
- `POST /messages/group` - Send a message into a group conversation.
- `POST /messages/upload-image` - Upload an image inside chat.
- `PATCH /messages/:id/recall` - Recall/hide a message content.

### 🤖 Gemini AI Helper (`/api/ai`)

- `POST /summarize` - Summarize the last 50 messages of a conversation.
- `POST /title` - Suggest an appropriate group title based on recent message contents.
- `POST /actions` - Extract action tasks from recent conversation messages.
- `POST /improve` - Improve a message draft (professional, shorter, friendlier, clearer).
- `POST /translate` - Translate message drafts into English or Vietnamese.

### 👑 Admin Moderation Panel (`/api/admin`)

- `GET /users` - Retrieve all users list.
- `PATCH /users/:id/role` - Elevate/demote user roles.
- `PATCH /users/:id/ban` - Ban/unban user accounts.
- `DELETE /users/:id` - Purge user from the system.
- `GET /groups` - List all group chats in the system.
- `DELETE /groups/:id` - Dissolve/delete a group chat.
- `GET /analytics` - Retrieve active analytics metrics.

---

# 📄 License

Licensed under the **MIT License**. See the `LICENSE` file for details.

---

<br/>
<br/>

# 🇻🇳 Tài liệu Tiếng Việt

## 📖 Giới thiệu

**Ostro Backend** là hệ thống máy chủ hiện đại được xây dựng dựa trên **Node.js (v22)**, **Express v5 (ES Modules)** và cơ sở dữ liệu **MongoDB**. Hệ thống được thiết kế để hỗ trợ kết nối realtime tốc độ cao, tích hợp các dịch vụ AI và cung cấp bảng điều khiển quản trị toàn diện.

Hệ thống tích hợp quy trình xác thực an toàn, giao tiếp qua WebSocket, quản lý file media đám mây và kết hợp các mô hình ngôn ngữ lớn để mang lại các tính năng thông minh như tóm tắt chat, trích xuất công việc, tối ưu văn bản và dịch ngôn ngữ trực tiếp.

> 📝 **Tài liệu API Swagger:** Sau khi khởi động máy chủ thành công, bạn có thể truy cập tài liệu hướng dẫn API tương tác tại [http://localhost:5001/api-docs/](http://localhost:5001/api-docs/)

---

## ✨ Các tính năng nổi bật

<table>
<tr>
<td width="50%">

### 🔐 Xác thực & Bảo mật

- Xác thực dựa trên JWT kết hợp cookie-parser an toàn.
- Cơ chế tự động làm mới token thông qua `POST /api/auth/refresh`.
- Tích hợp đăng nhập nhanh qua Google OAuth 2.0.
- Mã hóa mật khẩu người dùng bằng thư viện `bcrypt`.
- Middleware phân quyền truy cập route và quyền admin/moderator chặt chẽ.

</td>
<td width="50%">

### 💬 Kết nối Real-time WebSocket

- WebSocket Server quản lý bởi thư viện Socket.io.
- Phát trạng thái hoạt động của người dùng trực tiếp qua sự kiện `online-users`.
- Nhắn tin trực tiếp và nhóm thời gian thực với cơ chế tự động quản lý room.
- Cập nhật số lượng tin nhắn chưa đọc realtime.

</td>
</tr>

<tr>
<td width="50%">

### 🤖 Tích hợp AI (Gemini 2.5)

- Sử dụng bộ SDK `@google/genai` với mô hình `gemini-2.5-flash`.
- **Tóm tắt hội thoại**: Tổng hợp nội dung các cuộc thảo luận gần đây.
- **Trích xuất công việc**: Tự động nhận diện danh sách công việc (action items) từ tin nhắn chat.
- **Đề xuất tên nhóm**: Gợi ý đặt tên nhóm dựa trên ngữ cảnh hội thoại.
- **Tối ưu tin nhắn**: Thay đổi văn phong soạn thảo (Chuyên nghiệp, Ngắn gọn, Thân thiện, Dễ hiểu).
- **Dịch tin nhắn**: Dịch tin nhắn nhanh giữa Tiếng Việt và Tiếng Anh.

</td>
<td width="50%">

### 👑 Bảng quản trị Admin

- Phân quyền thao tác riêng biệt cho các vai trò `admin` và `moderator`.
- Quản lý tài khoản: Đổi phân quyền, Khóa/Mở khóa tài khoản, Xóa người dùng.
- Quản lý nhóm chat: Xem danh sách và giải tán các nhóm vi phạm tiêu chuẩn.
- Thống kê hệ thống: Theo dõi lượng người dùng hoạt động ngày (DAU), tháng (MAU), tốc độ đăng ký mới và tần suất gửi tin nhắn.

</td>
</tr>

<tr>
<td width="50%">

### ☁️ Upload file Media đám mây

- Xử lý trung gian file với Multer và lưu trữ trên Cloudinary.
- Hỗ trợ tải lên ảnh đại diện (avatar) và ảnh bìa (cover) của người dùng.
- Đính kèm hình ảnh trực tiếp trong hội thoại chat.
- Xác thực định dạng tệp tin và giới hạn dung lượng tải lên tối đa là 1MB.

</td>
<td width="50%">

### 🤝 Hệ thống Bạn bè & Hội thoại

- Gửi, chấp nhận, từ chối, hoặc thu hồi lời mời kết bạn.
- Danh sách bạn bè và kiểm tra mối quan hệ bạn bè.
- Tạo hội thoại trực tiếp/nhóm, thêm thành viên mới, và rời nhóm chat.
- Tính năng thu hồi tin nhắn kèm cập nhật realtime qua websocket.
- Ghim và bỏ ghim cuộc trò chuyện lên đầu danh sách.

</td>
</tr>
</table>

---

## 🛠️ Công nghệ sử dụng

<div align="center">

| Thành phần             | Công nghệ                                      |
| :--------------------- | :--------------------------------------------- |
| **Môi trường chạy**    | Node.js v22 (ES Modules)                       |
| **Framework**          | Express v5.x                                   |
| **Cơ sở dữ liệu**      | MongoDB • Mongoose v9.x                        |
| **Giao tiếp Realtime** | Socket.io v4.x                                 |
| **AI SDK**             | Google GenAI SDK (`@google/genai` v2.4.x)      |
| **Xác thực**           | JSON Web Tokens • Google Auth Library • bcrypt |
| **Xử lý Tải file**     | Multer • Cloudinary SDK                        |
| **Tài liệu API**       | Swagger UI Express                             |
| **Công cụ phát triển** | ESLint v10.x • Prettier • Husky • Lint-staged  |

</div>

---

## 📂 Cấu trúc thư mục dự án

```bash
ostro-be/
│
├── .husky/                     # Cấu hình Git Hooks
├── public/                     # Thư mục chứa tài nguyên tĩnh
│   └── logo.svg                # Logo hệ thống Ostro
│
├── src/
│   ├── controllers/            # Bộ điều hướng xử lý logic request (auth, user, admin, message, conversation, AI)
│   ├── libs/                   # Cấu hình kết nối các thư viện (kết nối cơ sở dữ liệu MongoDB)
│   ├── middlewares/            # Các middleware Express và Socket
│   ├── models/                 # Định nghĩa các schema cơ sở dữ liệu Mongoose
│   ├── routes/                 # Định nghĩa các endpoint API (auth, user, admin, messages, conversations, AI)
│   ├── services/               # Tách lớp logic nghiệp vụ (aiService, authService, userService)
│   ├── socket/                 # Cấu hình socket và lắng nghe kết nối thời gian thực
│   ├── utils/                  # Hàm tiện ích dùng chung và bộ kiểm tra dữ liệu đầu vào
│   ├── server.js               # File khởi động chính của ứng dụng
│   └── swagger.json            # Định nghĩa Swagger tài liệu API
│
├── .env                        # Chứa các biến môi trường cấu hình cục bộ (được bỏ qua trong Git)
├── .gitignore                  # Chỉ định các tệp không lưu trữ trên Git
├── eslint.config.js            # Cấu hình kiểm tra cú pháp ESLint mới (flat config)
├── package.json                # Định nghĩa dependencies và các script chạy dự án
├── pnpm-lock.yaml              # Lockfile quản lý dependency của PNPM
└── pnpm-workspace.yaml         # Cấu hình workspace của PNPM
```

---

# 🚀 Hướng dẫn khởi chạy

## 📋 Yêu cầu hệ thống

Hãy đảm bảo máy tính của bạn đã cài đặt sẵn:

- **Node.js**: phiên bản `v20.0.0` trở lên
- **MongoDB**: Cơ sở dữ liệu local hoặc tài khoản đám mây MongoDB Atlas
- **pnpm**: phiên bản `v9.x` trở lên

---

## ⚙️ Cài đặt

### 1️⃣ Cài đặt các thư viện phụ thuộc

Từ thư mục gốc dự án hoặc thư mục `ostro-be`, chạy lệnh:

```bash
pnpm install
```

---

### 2️⃣ Cấu hình biến môi trường

Tạo file `.env` nằm trong thư mục `ostro-be` với các giá trị sau:

```env
# Cấu hình Port
PORT=5001

# Chuỗi kết nối MongoDB
MONGODB_CONNECTION_STRING=your_mongodb_connection_string

# URL client frontend (CORS & Socket.io)
CLIENT_URL=http://localhost:5173

# Khóa bí mật mã hóa JWT
ACCESS_TOKEN_SECRET=your_long_random_jwt_access_secret_key

# Tích hợp Cloudinary lưu trữ ảnh
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Cấu hình Client ID của Google OAuth 2.0
GOOGLE_CLIENT_ID=your_google_oauth_client_id

# Khóa API Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key
```

---

### 3️⃣ Chạy Server ở môi trường phát triển

Khởi động server kèm tính năng tự động khởi động lại khi sửa file (sử dụng Nodemon):

```bash
pnpm dev
```

---

## 📜 Các câu lệnh script

Dưới đây là các câu lệnh có sẵn trong file `package.json`:

| Câu lệnh        | Chức năng                                            |
| :-------------- | :--------------------------------------------------- |
| `pnpm dev`      | Chạy ứng dụng ở chế độ development với Nodemon       |
| `pnpm start`    | Chạy ứng dụng ở chế độ production                    |
| `pnpm lint`     | Phân tích lỗi cú pháp và code quality bằng ESLint    |
| `pnpm lint:fix` | Tự động sửa các lỗi format có thể tự sửa bằng ESLint |

---

# 🏗️ Tổng quan API Endpoints

### 🔐 Xác thực (`/api/auth`)

- `POST /signup` - Đăng ký tài khoản mới.
- `POST /signin` - Đăng nhập truyền thống bằng email và mật khẩu.
- `POST /google` - Đăng nhập bằng mã Google OAuth 2.0.
- `POST /signout` - Đăng xuất hệ thống và xóa session.
- `POST /refresh` - Đổi mã token truy cập mới bằng HTTP-only Refresh cookie.

### 👤 Thông tin người dùng (`/api/users`)

- `GET /me` - Lấy thông tin cá nhân của tài khoản hiện tại.
- `PATCH /me` - Cập nhật hồ sơ cá nhân.
- `PATCH /password` - Thay đổi mật khẩu tài khoản.
- `DELETE /me` - Hủy hoạt động và xóa tài khoản vĩnh viễn.
- `GET /search` - Tìm kiếm người dùng khác bằng username.
- `POST /uploadAvatar` - Tải ảnh đại diện lên Cloudinary (giới hạn 1MB).
- `POST /uploadCover` - Tải ảnh bìa lên Cloudinary (giới hạn 1MB).

### 💬 Trò chuyện & Tin nhắn (`/api/conversations` & `/api/messages`)

- `GET /conversations` - Lấy toàn bộ danh sách cuộc trò chuyện đã tham gia.
- `POST /conversations` - Khởi tạo một cuộc hội thoại trực tiếp.
- `DELETE /conversations/:id` - Xóa lịch sử cuộc trò chuyện.
- `PATCH /conversations/:id/rename` - Đổi biệt danh hoặc đặt lại tên nhóm chat.
- `PATCH /conversations/:id/pin` - Ghim/Bỏ ghim cuộc hội thoại lên đầu trang.
- `PATCH /conversations/:id/add-members` - Thêm thành viên vào cuộc trò chuyện nhóm.
- `POST /conversations/:id/leave` - Rời khỏi cuộc trò chuyện nhóm.
- `POST /messages/direct` - Gửi tin nhắn trực tiếp đến bạn bè.
- `POST /messages/group` - Gửi tin nhắn vào cuộc trò chuyện nhóm.
- `POST /messages/upload-image` - Tải ảnh đính kèm trong tin nhắn.
- `PATCH /messages/:id/recall` - Thu hồi một tin nhắn (ẩn nội dung).

### 🤖 Trợ lý AI thông minh (`/api/ai`)

- `POST /summarize` - Tóm tắt nội dung 50 tin nhắn chat gần nhất.
- `POST /title` - Đề xuất tên nhóm chat dựa theo bối cảnh tin nhắn gần đây.
- `POST /actions` - Tự động trích xuất danh sách công việc cần làm từ đoạn chat.
- `POST /improve` - Cải thiện câu chữ soạn thảo (Chuyên nghiệp, Ngắn gọn, Thân thiện, Dễ hiểu).
- `POST /translate` - Dịch nhanh nội dung tin nhắn sang Tiếng Anh hoặc Tiếng Việt.

### 👑 Điều phối & Quản trị viên (`/api/admin`)

- `GET /users` - Lấy danh sách toàn bộ người dùng trong hệ thống.
- `PATCH /users/:id/role` - Cập nhật phân quyền người dùng (admin, moderator, user).
- `PATCH /users/:id/ban` - Khóa hoặc mở khóa hoạt động tài khoản.
- `DELETE /users/:id` - Xóa tài khoản vĩnh viễn khỏi hệ thống.
- `GET /groups` - Lấy danh sách tất cả các nhóm chat trên hệ thống.
- `DELETE /groups/:id` - Xóa và giải tán một nhóm chat.
- `GET /analytics` - Thống kê các chỉ số hoạt động của hệ thống.

---

# 📄 Giấy phép

Hệ thống được phân phối dưới giấy phép **MIT License**. Xem chi tiết tại tệp tin `LICENSE`.

</div>
