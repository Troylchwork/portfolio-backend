import express from 'express';
import cors from 'cors';

// 1. 初始化 Express 應用程式 (這一行就是之前漏掉的！)
const app = express();

// 2. 設定 PORT（優先使用 Render 自動分配的 PORT，本地測試則用 5000）
const PORT = process.env.PORT || 5000;

// 3. 中介軟體 (Middlewares)
app.use(cors()); // 允許跨域請求（如 GitHub Pages 呼叫）
app.use(express.json()); // 允許接收前端傳來的 JSON 格式資料

// 4. 測試用的根路由 (GET /)
app.get('/', (req, res) => {
  res.json({ message: 'Portfolio Backend API is running successfully on Render!' });
});

// 5. 聯絡表單 API (POST /api/contact)
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;

  console.log('收到新的聯絡表單:', { name, email, message });

  // 暫時回傳成功訊息（之後可以在這裡加存入 MongoDB 的邏輯）
  res.status(200).json({
    success: true,
    message: 'Message received successfully!'
  });
});

// 6. 啟動伺服器並監聽 PORT
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});