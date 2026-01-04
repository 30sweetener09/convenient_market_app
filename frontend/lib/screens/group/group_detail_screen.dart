import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../widgets/custom_header.dart';
import '../../widgets/meal_plan_card.dart';
import 'package:di_cho_tien_loi/data/dto/group_dto.dart';
import 'package:di_cho_tien_loi/providers/group_provider.dart';

import '../../providers/meal_plan_provider.dart';
import '../meal_plan/meal_plan_detail_screen.dart';

class GroupDetailScreen extends StatefulWidget {
  final String groupId;

  const GroupDetailScreen({super.key, required this.groupId});

  @override
  State<GroupDetailScreen> createState() => _GroupDetailScreenState();
}

class _GroupDetailScreenState extends State<GroupDetailScreen> {
  GroupDTO? _group;
  bool _isLoading = true;

  int _activeTab = 0;
  final TextEditingController _searchCtrl = TextEditingController();

  final List<String> _tabs = ['Danh sách mua sắm', 'Thành viên', 'Tủ lạnh'];

  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadGroupDetail();

      // 🔥 default tab = meal plan
      context
          .read<MealPlanProvider>()
          .fetchMealPlansByGroup(widget.groupId);
    });
  }


  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadGroupDetail() async {
    try {
      final provider = context.read<GroupProvider>();
      final group = await provider.getGroupById(widget.groupId);

      setState(() {
        _group = group;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('❌ Load group detail error: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomHeader(
        showBack: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _group == null
          ? const Center(child: Text('Không tìm thấy nhóm'))
          : Column(
              children: [
                _buildHeader(),
                _buildTabSection(),
                const Divider(height: 1),
                _buildTabContent(),
              ],
            ),
    );
  }

  // ================= HEADER (GỌN – KÉO SÁT TRÊN) =================
  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Center(
            child: CircleAvatar(
              radius: 30,
              backgroundColor: Colors.grey[300],
              backgroundImage:
                  _group!.imageurl != null && _group!.imageurl!.isNotEmpty
                  ? NetworkImage(_group!.imageurl!)
                  : null,
              child: (_group!.imageurl == null || _group!.imageurl!.isEmpty)
                  ? const Icon(Icons.groups, size: 28, color: Colors.white)
                  : null,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            _group!.name,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 2),
          Text(
            _group!.description?.isNotEmpty == true
                ? _group!.description!
                : 'Chưa có mô tả',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12, color: Colors.grey[600]),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  // ================= TAB + SEARCH (CO GỌN TỐI ĐA) =================
  Widget _buildTabSection() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 4, 12, 8),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [_buildTabs(), const SizedBox(height: 6), _buildSearchBar()],
      ),
    );
  }

  Widget _buildTabs() {
    return Row(
      children: List.generate(_tabs.length, (index) {
        final isActive = _activeTab == index;
        final flexValue = index == 0 ? 2 : 1;

        return Expanded(
          flex: flexValue,
          child: GestureDetector(
            onTap: () {
              setState(() {
                _activeTab = index;
                _searchCtrl.clear();
              });

              if (index == 0) {
                context
                    .read<MealPlanProvider>()
                    .fetchMealPlansByGroup(widget.groupId);
              } else if (index == 1) {
                context
                    .read<GroupProvider>()
                    .getAllMemberOfGroup(widget.groupId);
              } else if (index == 2) {
                // context
                //     .read<FridgeProvider>()
                //     .fetchFridge(widget.groupId);
              }
            },

            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.symmetric(horizontal: 4),
              padding: const EdgeInsets.symmetric(vertical: 6),
              decoration: BoxDecoration(
                color: isActive ? Colors.green.shade50 : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isActive ? Colors.green : Colors.grey.shade300,
                ),
              ),
              child: Center(
                child: Text(
                  _tabs[index],
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                    color: isActive ? Colors.green : Colors.grey[700],
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ),
        );
      }),
    );
  }

  // ================= SEARCH (MẢNH – HIỆN ĐẠI) =================
  Widget _buildSearchBar() {
    return SizedBox(
      height: 36,
      child: TextField(
        controller: _searchCtrl,
        style: const TextStyle(fontSize: 13),
        decoration: InputDecoration(
          hintText: _activeTab == 0
              ? 'Tìm danh sách mua sắm'
              : _activeTab == 1
              ? 'Tìm thành viên'
              : 'Tìm trong tủ lạnh',
          hintStyle: TextStyle(fontSize: 12, color: Colors.grey[500]),
          prefixIcon: Icon(Icons.search, size: 18, color: Colors.grey[500]),
          filled: true,
          fillColor: Colors.grey.shade100,
          contentPadding: const EdgeInsets.symmetric(horizontal: 12),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(18),
            borderSide: BorderSide.none,
          ),
        ),
      ),
    );
  }

  // ================= TAB CONTENT =================
  Widget _buildTabContent() {
    return Expanded(
      child: IndexedStack(
        index: _activeTab,
        children: [
          _buildMealPlanTab(),
          const Center(child: Text('👥 Danh sách thành viên')),
          const Center(child: Text('🧊 Tủ lạnh')),
        ],
      ),
    );
  }

  Widget _buildMealPlanTab() {
    return Consumer<MealPlanProvider>(
      builder: (_, provider, __) {
        if (provider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        if (provider.mealPlans.isEmpty) {
          return const Center(child: Text('Chưa có meal plan'));
        }

        return ListView.builder(
          itemCount: provider.mealPlans.length,
          itemBuilder: (_, index) {
            final plan = provider.mealPlans[index];

            return MealPlanCard(
              name: plan.name,
              date: plan.timestamp,
              description: plan.description,
              isStarred: plan.status == 'PASS',
              // userEmail: plan.userEmail,
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => MealPlanDetailScreen(mealPlanId: plan.id),
                  ),
                );
              },
            );
          },
        );

      },
    );
  }


}
