# Kế hoạch Di trú Chi tiết (Detailed Migration Plan)

Tài liệu này hướng dẫn từng bước kỹ thuật để chuyển đổi QuizForge từ một ứng dụng cục bộ sang một hệ sinh thái Cloud hoàn chỉnh.

## Giai đoạn 1: Chuyển đổi Cơ sở dữ liệu (Prisma & Aiven)

Chúng ta sẽ di chuyển từ MongoDB sang PostgreSQL trên Aiven.

### 1.1. Cấu hình Prisma (apps/web/prisma/schema.prisma)
Thay đổi provider và kiểu dữ liệu ID của MongoDB sang `uuid()` hoặc `autoincrement()` của PostgreSQL.

```prisma
// apps/web/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Quiz {
  id          String   @id @default(uuid())
  title       String
  data        Json     // Chứa nội dung câu hỏi (JSONB)
  settings    Json     // Cài đặt bài tập (JSONB)
  creatorId   String
  isPublished Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 1.2. Tạo Database trên Aiven
1. Truy cập [Aiven Console](https://console.aiven.io/).
2. Tạo dự án mới, chọn "Create Service" -> PostgreSQL.
3. Chọn vị trí: **Singapore (aws-ap-southeast-1)** để có tốc độ tốt nhất về Việt Nam.
4. Lấy `SERVICE_URI` và dán vào file `.env` của Web.

---

## Giai đoạn 2: Thiết lập Hàng chờ nộp bài (Redis Queue)

Để cân 1000 học sinh, chúng ta không dùng API trực tiếp ghi vào DB.

### 2.1. Cấu trúc Queue trên Redis
Chúng ta sử dụng `List` của Redis (RPUSH / LPOP).

### 2.2. Mã nguồn mẫu cho Producer (Next.js API)
```typescript
// apps/web/src/app/api/quiz/submit/route.ts
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

export async function POST(req: Request) {
  const result = await req.json();
  // Đẩy vào hàng chờ ngay lập tức
  await redis.rpush("quiz_submissions", JSON.stringify(result));
  return Response.json({ status: "submitted_to_queue" });
}
```

---

## Giai đoạn 3: Luồng Đồng bộ tài nguyên (Creator Sync)

Ứng dụng Creator sẽ thực hiện việc "đóng gói" (Bundle) thay cho Lumi.

### 3.1. Chuẩn bị tài nguyên
1. Quét tất cả `<img>`, `<video>` trong bài tập.
2. Upload lên S3 và lấy URL thay thế vào JSON.

### 3.2. Cấu hình S3/Vercel Blob
Sử dụng SDK để upload với chế độ "CORS Allowed":
```typescript
// apps/creator/src/services/sync.ts
import { put } from "@vercel/blob";

async function publishToCloud(quizData: Quiz) {
   // 1. Upload media...
   // 2. Sync Metadata tới Next.js
   const response = await fetch("https://quizforge.io/api/quizzes/sync", {
     method: "POST",
     body: JSON.stringify(quizData),
     headers: { "Authorization": `Bearer ${token}` }
   });
}
```

---

## Giai đoạn 4: Kiểm thử chịu tải (Load Testing)

Sử dụng `k6` để giả lập 1000 học sinh.

### k6 Script mẫu
```javascript
import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 1000,
  duration: '30s',
};

export default function () {
  http.post('https://quizforge.io/api/quiz/submit', JSON.stringify({
    quizId: 'test-id',
    answers: [1, 2, 3]
  }));
  sleep(1);
}
```

---

## Giai đoạn 5: Triển khai (Deployment)

1. **Deploy Redis & DB**: Trên Aiven.
2. **Deploy Web**: Trên Vercel (Auto-scale).
3. **Build App Creator**: Đóng gói bản EXE mới có tính năng "Cloud Publish".
