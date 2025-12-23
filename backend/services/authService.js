import nodemailer from "nodemailer";
import { google } from "googleapis";
import { supabase, supabaseAdmin } from "../db.js";

/* =======================
   GOOGLE OAUTH2 CONFIG
======================= */

const {
  MAIL_USER,
  GG_CLIENT_ID,
  GG_CLIENT_SECRET,
  GG_REFRESH_TOKEN,
} = process.env;

if (!MAIL_USER || !GG_CLIENT_ID || !GG_CLIENT_SECRET || !GG_REFRESH_TOKEN) {
  console.error("❌ Missing Gmail OAuth env variables");
}

const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  GG_CLIENT_ID,
  GG_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({
  refresh_token: GG_REFRESH_TOKEN,
});

/* =======================
   MAIL SENDER
======================= */

const sendMail = async ({ to, subject, html }) => {
  const accessTokenObj = await oauth2Client.getAccessToken();
  const accessToken = accessTokenObj?.token;

  if (!accessToken) {
    throw new Error("CANNOT_GET_ACCESS_TOKEN");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: MAIL_USER,
      clientId: GG_CLIENT_ID,
      clientSecret: GG_CLIENT_SECRET,
      refreshToken: GG_REFRESH_TOKEN,
      accessToken,
    },
  });

  return transporter.sendMail({
    from: `"Your App" <${MAIL_USER}>`,
    to,
    subject,
    html,
  });
};

/* =======================
   OTP UTILS
======================= */

const generateCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/* =======================
   SEND VERIFICATION CODE
======================= */

export const sendVerificationCodeService = async (email) => {
  if (!email) throw new Error("EMAIL_REQUIRED");

  const code = generateCode();
  const expires = new Date(Date.now() + 2 * 60 * 1000); // 2 phút

  // 1️⃣ GỬI MAIL TRƯỚC
  try {
    await sendMail({
      to: email,
      subject: "Mã xác thực",
      html: `
        <h2>Mã xác thực</h2>
        <p>Mã OTP: <b style="font-size:18px">${code}</b></p>
        <p>Có hiệu lực trong 2 phút.</p>
      `,
    });
  } catch (err) {
    console.error("❌ SEND MAIL FAILED:", err);
    throw new Error("EMAIL_SEND_FAILED");
  }

  // 2️⃣ INSERT DB (CHỈ KHI MAIL OK)
  const { error: dbError } = await supabaseAdmin
    .from("verification_codes")
    .insert({
      email,
      code,
      expires_at: expires,
    });

  if (dbError) {
    console.error("❌ DB INSERT ERROR:", dbError);
    throw new Error("DB_INSERT_FAILED");
  }

  return {
    email,
    expires,
  };
};

/* =======================
   VERIFY OTP
======================= */

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

  // Xóa OTP sau khi dùng
  await supabaseAdmin
    .from("verification_codes")
    .delete()
    .eq("id", data.id);

  return true;
};
