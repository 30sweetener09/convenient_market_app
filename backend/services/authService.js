// convenient_market_app/backend/services/authService.js
import { Resend } from "resend";
import { supabase, supabaseAdmin } from "../db.js";

const resend = new Resend(process.env.RESEND_API_KEY);

// 6 số
const generateCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/**
 * Gửi mã xác thực
 */
export const sendVerificationCodeService = async (email) => {
  if (!email) throw new Error("EMAIL_REQUIRED");

  const code = generateCode();
  const expires = new Date(Date.now() + 2 * 60 * 1000);

  // 1️⃣ GỬI MAIL TRƯỚC
  const { data, error } = await resend.emails.send({
    from: "Your App <no-reply@resend.dev>", // test domain
    to: email,
    subject: "Mã xác thực",
    html: `
      <h2>Mã xác thực</h2>
      <p>Mã OTP: <b style="font-size:18px">${code}</b></p>
      <p>Có hiệu lực trong 2 phút.</p>
    `,
  });

  console.log("RESEND DATA:", data);
  console.log("RESEND ERROR:", error);

  if (error || !data?.id) {
    throw new Error("EMAIL_SEND_FAILED");
  }

  // 2️⃣ CHỈ INSERT KHI GỬI OK
  const { error: dbError } = await supabaseAdmin
    .from("verification_codes")
    .insert({
      email,
      code,
      expires_at: expires,
    });

  if (dbError) {
    console.error("DB INSERT ERROR:", dbError);
    throw new Error("DB_INSERT_FAILED");
  }

  return { email, expires };
};

/**
 * Verify mã
 */
export const verifyCodeService = async (email, code) => {
  if (!email || !code) throw new Error("INVALID_INPUT");

  const { data, error } = await supabase
    .from("verification_codes")
    .select("*")
    .eq("email", email)
    .eq("code", code)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error("INVALID_CODE");
  }

  if (new Date(data.expires_at) < new Date()) {
    throw new Error("CODE_EXPIRED");
  }

  // Xóa mã sau khi dùng
  await supabaseAdmin
    .from("verification_codes")
    .delete()
    .eq("id", data.id);

  return true;
};
