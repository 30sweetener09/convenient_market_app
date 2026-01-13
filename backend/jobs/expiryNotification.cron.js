import cron from "node-cron";
import { supabase, supabaseAdmin } from "../db.js";
import { firebaseAdmin } from "../services/firebase.js";

export const startExpiryCron = () => {
  cron.schedule("*/2 * * * *", async () => {

    console.log("⏰ Running expiry notification cron...");

    try {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(now.getDate() + 1);

      // 👉 YYYY-MM-DD (local)
      const todayStr = now.toISOString().slice(0, 10);
      const tomorrowStr = tomorrow.toISOString().slice(0, 10);

      const start = `${todayStr} 00:00:00`;
      const end = `${tomorrowStr} 23:59:59`;

      console.log(`   → Checking items expiring between ${start} and ${end}`);

      // 1️⃣ Lấy đồ sắp hết hạn
      const { data: items, error } = await supabaseAdmin
        .from("fridge_food")
        .select(`
          id,
          expirydate,
          food:food_id ( name ),
          fridge:fridge_id ( id, name, group_id )
        `)
        .gte("expirydate", start)
        .lte("expirydate", end);

      if (error) {
        console.error("❌ Supabase error:", error);
        return;
      }

      console.log(`✅ Found ${items.length} items expiring soon`);

      for (const item of items) {
        // 2️⃣ Members trong group
        const { data: members, error: memberError } = await supabase
          .from("group_members")
          .select(`
            user_id,
            users (
              id,
              user_devices ( fcm_token )
            )
          `)
          .eq("group_id", item.fridge.group_id);

        if (memberError) {
          console.error("❌ Member query error:", memberError);
          continue;
        }

        if (!Array.isArray(members) || members.length === 0) {
          console.log("⚠️ No members in group", item.fridge.group_id);
          continue;
        }

        // 3️⃣ Push notification (multicast)
        for (const member of members) {
          const devices = member.users?.user_devices || [];

          const tokens = devices
            .map(d => d.fcm_token)
            .filter(t => t && t !== "null" && t !== "undefined");

          if (!tokens.length) continue;

          const response =
            await firebaseAdmin.messaging().sendEachForMulticast({
              tokens,
              notification: {
                title: "⏰ Thực phẩm sắp hết hạn",
                body: `${item.food.name} sẽ hết hạn trong 24h`,
              },
              data: {
                fridgeId: String(item.fridge.id),
                foodName: item.food.name,
                groupId: String(item.fridge.group_id),
                expirydate: String(item.expirydate),
                type: "FOOD_EXPIRED",
              },
            });

          response.responses.forEach((r, idx) => {
            if (!r.success) {
              console.error(
                "❌ Invalid token:",
                tokens[idx],
                r.error?.message
              );
            }
          });

          console.log(
            `🔔 Pushed ${response.successCount}/${tokens.length} → user ${member.user_id}`
          );
        }
      }
    } catch (err) {
      console.error("❌ Expiry cron error:", err);
    }
  });
};
