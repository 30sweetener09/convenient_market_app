import 'package:di_cho_tien_loi/screens/food/food_screen.dart';
import 'package:flutter/material.dart';
import './user/user_screen.dart';
import './group/group_screen.dart';
import './fridge/fridge_screen.dart';
import './recipe/recipe_screen.dart';
import './stats/stats_screen.dart';
import './home/home_screen.dart';
import './notification_screen.dart';
import '../widgets/custom_bottom_nav.dart';

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
    StatsScreen(),
    UserScreen(),
    NotificationScreen(),
  ];

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      appBar: _buildHeader(),
      body: IndexedStack(
        index: _currentIndex,
        children: _pages,
      ),

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
      backgroundColor: Color(0xFF4C663C),
      toolbarHeight: 60,
      elevation: 0,
      titleSpacing: 0,
      leading: Padding(
        padding: const EdgeInsets.only(left: 16.0),
        child: GestureDetector(
          onTap: () {setState(() {_currentIndex = 5; });},
          child: CircleAvatar(
            backgroundColor: Colors.white,
            backgroundImage: hasAvatar ? NetworkImage(avatarUrl!) : null,
            child:
              !hasAvatar 
              ? Icon(Icons.person, color: Color(0xFF4C663C), size: 24)
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
      actions: [
      Padding(
        padding: const EdgeInsets.only(right: 8.0), // IconButton đã có sẵn khoảng trống nội bộ
        child: IconButton(
          icon: const Icon(Icons.notifications, color: Colors.yellow),
          onPressed: () => setState(() => _currentIndex = 6),
        ),
      ),
    ],
    );
  }
  Widget _buildBottomBar() {
    return BottomAppBar(
      shape: const CircularNotchedRectangle(), // Tạo đường lượn cho nút FAB
      notchMargin: 8.0,
      color: const Color(0xFF4C663C),
      child: SizedBox(
        height: 60,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            // Các nút bên trái nút Home
            _bottomNavItem(0, Icons.group_outlined, Icons.group),
            _bottomNavItem(1, Icons.kitchen_outlined, Icons.kitchen),
            _bottomNavItem(2, Icons.home_outlined, Icons.home),
            // Các nút bên phải nút Home
            _bottomNavItem(3, Icons.menu_book_outlined, Icons.menu_book),
            _bottomNavItem(4, Icons.bar_chart_outlined, Icons.bar_chart),
          ],
        ),
      ),
    );
  }

  // Hàm tạo icon item để code sạch hơn
  Widget _bottomNavItem(int index, IconData iconOutlined, IconData iconFilled) {
    bool isSelected = _currentIndex == index;
    return GestureDetector(
    onTap: () => setState(() => _currentIndex = index),
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        // Nếu được chọn thì hiện hình tròn trắng mờ (hoặc màu tùy chọn)
        color: isSelected ? const Color.fromARGB(235, 255, 255, 255) : Colors.transparent,
        shape: BoxShape.circle,
      ),
      child: Icon(
        isSelected ? iconFilled : iconOutlined,
        color: isSelected ? Color(0xFF4C663C) : Colors.white,
        size: 28,
      ),
    ),
  );
  
  }
  Widget _floatButton (int index) {
    bool isSelected = _currentIndex == index;
    return FloatingActionButton(
      backgroundColor: isSelected ? Colors.white : const Color(0xFF4C663C),
      shape: const CircleBorder(side: BorderSide(color: Colors.white, width: 4)),
      onPressed: () => setState(() => _currentIndex = index),
      child: Icon(
        Icons.home,
        color: isSelected ? const Color(0xFF4C663C) : Colors.white,
        size: 30,
      ),
    );
  }
}