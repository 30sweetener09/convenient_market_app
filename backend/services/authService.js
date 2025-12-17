import nodemailer from "nodemailer";
import { supabase, supabaseAdmin } from "../db.js";

// 6 số
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Nodemailer SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,     // Gmail
    pass: process.env.MAIL_PASS      // App password
  }
});

export const sendVerificationCodeService = async (email) => {
  if (!email) throw new Error("Email required");

  // 1) Tạo mã
  const code = generateCode();
  const expires = new Date(Date.now() + 2 * 60 * 1000); // 2 phút

  // 2) Lưu vào bảng
  const { error: saveError } = await supabaseAdmin
    .from("verification_codes")
    .insert([
      { email, code, expires_at: expires }
    ]);

  if (saveError) {
    console.error(saveError);
    throw new Error("Cannot save verification code");
  }

  // 3) Gửi email
  await transporter.sendMail({
    from: `"Your App" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Mã xác thực đổi mật khẩu",
    html: `
      <h2>Mã xác thực của bạn</h2>
      <p>Mã OTP: <b style="font-size:18px">${code}</b></p>
      <p>Mã có hiệu lực trong 5 phút.</p>
    `
  });

  return { email, expires };
};

// Verify code
export const verifyCodeService = async (email, code) => {
  const { data, error } = await supabase
    .from("verification_codes")
    .select("*")
    .eq("email", email)
    .eq("code", code)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) throw new Error("Mã không hợp lệ");

  if (new Date(data.expires_at) < new Date())
    throw new Error("Mã đã hết hạn");

   // Optionally delete or mark used
  await supabase.from("verification_codes").delete().eq("id", data.id);

  return true;
};
