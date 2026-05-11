// ============================================================
// Firebase Cloud Function — Push Bildirim Tetikleyici
// ============================================================
// Kurulum:
//   npm install -g firebase-tools
//   firebase init functions
//   Bu kodu functions/index.js'e yapıştır
//   npm install (functions/ içinde)
//   firebase deploy --only functions
// ============================================================

const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.database();

/**
 * Realtime DB'de /notifications/{id} oluşturulunca tetiklenir.
 * Admin panelinden "Görev Ekle" veya "Bildirim Gönder" butonuna
 * basıldığında bu node'a yazılır.
 */
exports.sendPushOnNewNotification = functions.database
  .ref("/notifications/{notifId}")
  .onCreate(async (snapshot, context) => {
    const notif = snapshot.val();

    // Zaten gönderilmişse atla
    if (notif.sent) return null;

    const { title, body, target } = notif;

    // FCM topic mesajı — kullanıcılar topic'e abone olmalı
    // Topic: "all", "yazilim", "elektronik", "mekanik"
    const topicName = target === "all" ? "all_users" : `dept_${target}`;

    const message = {
      notification: { title, body },
      android: { notification: { sound: "default", priority: "high" } },
      apns: { payload: { aps: { sound: "default" } } },
      webpush: {
        notification: { icon: "/icon-192.png" },
        fcmOptions: { link: "/" }
      },
      topic: topicName
    };

    try {
      const response = await admin.messaging().send(message);
      console.log(`Bildirim gönderildi (topic: ${topicName}):`, response);

      // Gönderildi olarak işaretle
      await snapshot.ref.update({ sent: true, sentAt: Date.now() });
    } catch (error) {
      console.error("Bildirim gönderilemedi:", error);
    }

    return null;
  });

/**
 * Kullanıcı FCM token'ını kaydetmek için HTTP endpoint
 * Frontend'den fetch() ile çağrılır:
 *   fetch('/registerToken', { method:'POST', body: JSON.stringify({ token, dept }) })
 */
exports.registerToken = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") { res.status(405).send("Method Not Allowed"); return; }

  const { token, dept } = req.body;
  if (!token) { res.status(400).send("Token gerekli"); return; }

  try {
    // All users topic
    await admin.messaging().subscribeToTopic([token], "all_users");

    // Dept topic
    if (dept && ["yazilim", "elektronik", "mekanik"].includes(dept)) {
      await admin.messaging().subscribeToTopic([token], `dept_${dept}`);
    }

    // Token'ı DB'ye kaydet
    await db.ref(`fcm_tokens/${token.slice(-20)}`).set({
      token, dept: dept || "all", createdAt: Date.now()
    });

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});
