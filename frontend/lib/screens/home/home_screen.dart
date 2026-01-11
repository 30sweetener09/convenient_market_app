import 'package:di_cho_tien_loi/providers/recipe_provider.dart';
import 'package:di_cho_tien_loi/screens/home/group_expiry_section.dart';
import 'package:di_cho_tien_loi/screens/home/recipe_section.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../providers/user_provider.dart';
import '../../../services/notification_service.dart';

import 'package:di_cho_tien_loi/providers/group_provider.dart';
import 'package:di_cho_tien_loi/providers/fridge_item_provider.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _loaded = false;

  @override
  void initState() {
    super.initState();

    /// 🔔 Xin quyền + lắng nghe notification
    NotificationService.init(context);
  }
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();

    if (_loaded) return;
    _loaded = true;

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final groupProvider = context.read<GroupProvider>();
      final fridgeProvider = context.read<FridgeItemProvider>();
      final recipeProvider = context.read<RecipeProvider>();

      /// đảm bảo đã có groups
      if (groupProvider.allGroups == null || groupProvider.allGroups!.isEmpty) {
        await groupProvider.getAllGroups();
      }

      /// fetch item cho từng group
      for (final group in groupProvider.allGroups!) {
        await fridgeProvider.fetchAllItemsOfGroup(groupId: int.parse(group.id));
      }

      // lấy recipe 
      if (recipeProvider.recipes.isEmpty) {
        await recipeProvider.fetchRecipes();
      }
      
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Center (
          child: Text(
          "Trang chủ",
          style: TextStyle(
            fontSize: 20,
            fontFamily: "Unbounded",
            color: Color(0xFF396A30),
          ),
        ),
      ),),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          RecipeHomeSection(),
          SizedBox(height: 24),
          GroupExpirySection(), // 👈 dùng section mới
        ],
      ),
    );
  }
}
