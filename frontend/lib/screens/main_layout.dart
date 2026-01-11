import 'package:di_cho_tien_loi/screens/food/food_screen.dart';
import 'package:flutter/material.dart';
import './user/user_screen.dart';
import './group/group_screen.dart';
import './recipe/recipe_screen.dart';
import './home/home_screen.dart';
import '../widgets/custom_bottom_nav.dart';

import './fridge/fridge_screen.dart';
import './stats/stats_screen.dart';
import './notification_screen.dart';

import 'package:provider/provider.dart';
import '../../../providers/user_provider.dart';

class MainLayout extends StatefulWidget {
  const MainLayout({super.key});

  @override
  State<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends State<MainLayout> {
  int _currentIndex = 2; // Mặc định chọn nút Home (vị trí giữa)

  final List<Widget> _pages = [
    GroupScreen(),
    RecipeScreen(),
    HomeScreen(),
    // FridgeScreen(),
    FoodScreen(),
    //StatsScreen(),
    UserScreen(),
    //NotificationScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _buildHeader(),
      body: IndexedStack(index: _currentIndex, children: _pages),

      // Thanh điều hướng dưới cùng _buildBottomBar()
      bottomNavigationBar: CustomBottomNav(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
      ),
    );
  }

  PreferredSizeWidget _buildHeader() {
    final userProvider = context.watch<UserProvider>();
    final user = userProvider.user;
    // Tạo biến helper
    final hasAvatar = user?.photoUrl?.isNotEmpty ?? false;
    final avatarUrl = user?.photoUrl;

    return AppBar(
      backgroundColor: Color(0xFF396A30),
      toolbarHeight: 60,
      elevation: 0,
      titleSpacing: 0,
      leading: Padding(
        padding: const EdgeInsets.only(left: 16.0),
        child: GestureDetector(
          onTap: () {
            setState(() {
              _currentIndex = 4;
            });
          },
          child: CircleAvatar(
            backgroundColor: Colors.white,
            backgroundImage: hasAvatar ? NetworkImage(avatarUrl!) : null,
            child: !hasAvatar
                ? Icon(Icons.person, color: Color(0xFF396A30), size: 24)
                : null,
          ),
        ),
      ),
      title: const Text(
        'ĐiChợTiệnLợi',
        style: TextStyle(
          fontFamily: 'Unbounded',
          fontWeight: FontWeight.w600,
          fontSize: 20,
          color: Colors.white,
        ),
      ),
      centerTitle: true,
      /*
      actions: [
      Padding(
        padding: const EdgeInsets.only(right: 8.0), // IconButton đã có sẵn khoảng trống nội bộ
        child: IconButton(
          icon: const Icon(Icons.notifications, color: Colors.yellow),
          onPressed: () => setState(() => _currentIndex = 6),
        ),
      ),
    ],*/
    );
  }
}
