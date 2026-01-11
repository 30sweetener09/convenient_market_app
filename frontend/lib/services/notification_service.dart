import 'package:di_cho_tien_loi/screens/group/group_detail_screen.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';

import '../screens/meal_plan/meal_plan_detail_screen.dart';
import 'local_notification_service.dart';

class NotificationService {
  static final _messaging = FirebaseMessaging.instance;

  static Future<void> init(BuildContext context) async {
    await LocalNotificationService.init();

    await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    /// 🔥 FOREGROUND
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('🔔 FOREGROUND NOTIFICATION');

      final title = message.notification?.title ?? 'no title';
      final body = message.notification?.body ?? 'no body';
      final data = message.data;

      // 👉 show local notification
      LocalNotificationService.show(
        title: title,
        body: body,
        payload: data.toString(),
      );
    });

    /// 👉 CLICK background
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      _handleNotificationClick(context, message.data);
    });
  }


  /// Lấy FCM token (AuthProvider đang dùng)
  static Future<String?> getFcmToken() async {
    return await _messaging.getToken();
  }

  static void _handleNotificationClick(
      BuildContext context,
      Map<String, dynamic> data,
      ) {
    final type = data['type'];

    if (type == 'TASK_ASSIGNED') {
      final mealPlanId = int.parse(data['mealPlanId']);
      debugPrint('➡️ Navigate to MealPlan $mealPlanId');
      Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) =>
                MealPlanDetailScreen(mealPlanId: mealPlanId),
          ));

      // Navigator.push(...)
    } else if (type == 'FOOD_EXPIRED') {
      final groupId = data['groupId'];
      Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) =>
                GroupDetailScreen(groupId: groupId, indexTab: 2,),
          ));

    }
  }
}
