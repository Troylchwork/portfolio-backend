import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { Resend } from "resend"; // 1. 引入 Resend

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 2. 初始化 Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// 3. 連接 MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI;
if (MONGO_URI) {
    mongoose
        .connect(MONGO_URI)
        .then(() => console.log("Successfully connected to MongoDB Atlas!"))
        .catch((err) => console.error("MongoDB connection error:", err));
}

// 4. 定義 Contact Schema
const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const Contact = mongoose.model("Contact", contactSchema);

// 測試根路由
app.get("/", (req, res) => {
    res.json({ message: "Portfolio Backend is running with Resend & MongoDB!" });
});

// 5. POST 聯絡表單 API
app.post("/api/contact", async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // 任務 A: 寫入 MongoDB 資料庫
        const newContact = await Contact.create({
            name,
            email,
            subject,
            message,
        });
        console.log("Saved to MongoDB:", newContact._id);

        // 任務 B: 透過 Resend HTTPS API 發送 Email 通知
        try {
            const emailResponse = await resend.emails.send({
                from: "onboarding@resend.dev", // 👈 改成這樣最簡潔
                to: process.env.EMAIL_USER,
                replyTo: email,
                subject: `[Portfolio Notification] 新留言: ${subject}`,
                html: `
                      <h3>你的網站收到了一筆新聯絡表單！</h3>
                      <p><strong>姓名：</strong> ${name}</p>
                      <p><strong>Email：</strong> ${email}</p>
                      <p><strong>主題：</strong> ${subject}</p>
                      <p><strong>內容：</strong></p>
                      <blockquote style="background: #f4f4f4; padding: 10px; border-left: 3px solid #ccc;">
                        ${message}
                      </blockquote>
                      <p><small>紀錄時間：${new Date().toLocaleString()}</small></p>
                    `,
            });

            console.log("✅ Resend Email sent successfully:", emailResponse);
        } catch (emailErr) {
            // 獨立捕捉 Email 錯誤，避免發信問題阻斷表單成功狀態
            console.error("❌ Resend Email sending failed:", emailErr.message);
        }

        // 回傳成功給前端
        res.status(201).json({
            success: true,
            message: "Message saved successfully!",
        });
    } catch (error) {
        console.error("Error in /api/contact:", error);
        res.status(500).json({
            success: false,
            message: "Failed to process request",
            error: error.message,
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
