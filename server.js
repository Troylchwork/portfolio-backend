import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB Atlas!'))
    .catch((err) => console.error('MongoDB connection error:', err));
}

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Contact = mongoose.model('Contact', contactSchema);

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, 
  family: 4,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false 
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'Portfolio Backend is running with DB & Email Notification!' });
});

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    const newContact = await Contact.create({
      name,
      email,
      subject,
      message,
    });
    console.log('Saved to MongoDB:', newContact._id);

    const mailOptions = {
      from: process.env.EMAIL_USER,
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
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Notification email sent successfully!');

    res.status(201).json({
      success: true,
      message: 'Message saved and email sent successfully!',
    });

  } catch (error) {
    console.error('Error processing contact form:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request',
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});