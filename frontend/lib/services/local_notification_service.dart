import 'package:flutter/cupertino.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class LocalNotificationService {
  static final _plugin = FlutterLocalNotificationsPlugin();

  static Future<void> init() async {
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');

    const settings = InitializationSettings(android: android);

    await _plugin.initialize(
      settings,
      onDidReceiveNotificationResponse: (response) {
        debugPrint('================ LOCAL NOTIFICATION CLICK ================');
        debugPrint('🔔 payload: ${response.payload}');
        debugPrint('🔔 actionId: ${response.actionId}');
        debugPrint('==========================================================');
      },
    );
  }

  static Future<void> show({
    required String title,
    required String body,
    String? payload,
  }) async {
    debugPrint('================ SHOW LOCAL NOTIFICATION ================');
    debugPrint('📩 title: $title');
    debugPrint('📩 body : $body');
    debugPrint('📩 payload: $payload');
    debugPrint('=========================================================');

    const android = AndroidNotificationDetails(
      'task_channel',
      'Task Notification',
      channelDescription: 'Notification for task updates',
      importance: Importance.max,
      priority: Priority.high,
      playSound: true,
    );

    await _plugin.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000, // 👈 id KHÔNG TRÙNG
      title,
      body,
      const NotificationDetails(android: android),
      payload: payload,
    );
  }
}
