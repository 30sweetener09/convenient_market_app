import 'dart:async';
import 'package:di_cho_tien_loi/data/dto/group_dto.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/group_provider.dart';
import './group_detail_screen.dart';
import 'create_group_modal.dart';

class GroupScreen extends StatefulWidget {
  const GroupScreen({super.key});

  @override
  State<GroupScreen> createState() => _GroupScreenState();
}

class _GroupScreenState extends State<GroupScreen> {
  // Chỉ giữ biến UI state
  bool _isInitialLoading = true; // Thay _isLoading
  bool _isSearching = false;
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  Timer? _searchDebounce;

  @override
  void initState() {
    super.initState();
    _loadGroups();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    _searchDebounce?.cancel();
    super.dispose();
  }

  void _showCreateGroupModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return const CreateGroupModal();
      },
    ).then((value) {
      if (value == true) {
        // Refresh khi tạo nhóm mới
        _loadGroups();
      }
    });
  }

  Future<void> _loadGroups() async {
    try {
      final groupProvider = context.read<GroupProvider>();
      await groupProvider.getAllGroups();
      debugPrint("✅ Đã tải danh sách nhóm từ API");
      
      // Sau khi load xong, tắt loading
      if (mounted) {
        setState(() {
          _isInitialLoading = false;
        });
      }
    } catch (e) {
      debugPrint('❌ Error loading groups: $e');
      if (mounted) {
        setState(() {
          _isInitialLoading = false;
        });
      }
      _showErrorSnackbar('Không thể tải danh sách nhóm');
    }
  }

  void _showErrorSnackbar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  void _searchGroups(String query) async {
    setState(() {
      _searchQuery = query;
      _isSearching = true;
    });

    try {
      if (query.isEmpty) {
        setState(() {
          _isSearching = false;
        });
      } else {
        await context.read<GroupProvider>().searchGroups(query);
        setState(() {
          _isSearching = false;
        });
      }
    } catch (e) {
      debugPrint('Error searching groups: $e');
      setState(() {
        _isSearching = false;
      });
    }
  }

  void _performSearch() {
    final query = _searchController.text.trim();
    _searchGroups(query);
    FocusScope.of(context).unfocus();
  }

  void _clearSearch() {
    _searchController.clear();
    _searchGroups('');
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<GroupProvider>(
      builder: (context, groupProvider, child) {
        // Lấy dữ liệu từ provider
        final allGroups = groupProvider.allGroups ?? [];
        final providerIsLoading = groupProvider.isLoading;
        
        debugPrint('=== GroupScreen REBUILD ===');
        debugPrint('Provider isLoading: $providerIsLoading');
        debugPrint('Initial loading: $_isInitialLoading');
        debugPrint('Số lượng groups: ${allGroups.length}');
        debugPrint('Search query: $_searchQuery');

        // Filter groups nếu đang search
        final filteredGroups = _searchQuery.isEmpty
            ? allGroups
            : allGroups.where((group) {
                final name = group.name.toLowerCase();
                final query = _searchQuery.toLowerCase();
                final description = group.description?.toLowerCase() ?? '';
                return name.contains(query) || description.contains(query);
              }).toList();

        // Hiển thị loading chỉ khi lần đầu tải
        if (_isInitialLoading && allGroups.isEmpty) {
          return Scaffold(
            appBar: AppBar(
              title: Text('Nhóm của bạn'),
            ),
            body: Center(child: CircularProgressIndicator()),
          );
        }

        return Scaffold(
          appBar: AppBar(
            title: const Text('Nhóm của bạn'),
          ),
          body: Column(
            children: [
              // Thanh tìm kiếm
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: Colors.grey[300]!),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _searchController,
                          focusNode: _searchFocusNode,
                          decoration: InputDecoration(
                            hintText: 'Tìm kiếm nhóm...',
                            border: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 14,
                            ),
                            //prefixIcon: const SizedBox(width: 4),
                            suffixIcon: _searchController.text.isNotEmpty
                                ? IconButton(
                                    icon: const Icon(Icons.clear, size: 20),
                                    onPressed: _clearSearch,
                                  )
                                : null,
                          ),
                          onChanged: (value) {
                            if (_searchDebounce?.isActive ?? false) {
                              _searchDebounce!.cancel();
                            }
                            _searchDebounce = Timer(
                              const Duration(milliseconds: 500),
                              () {
                                _searchGroups(value);
                              },
                            );
                          },
                          onSubmitted: (value) {
                            _performSearch();
                          },
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(right: 8.0),
                        child: IconButton(
                          icon: const Icon(Icons.search, color: Colors.blue),
                          onPressed: _performSearch,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              // Kết quả tìm kiếm
              Expanded(
                child: _isSearching || (providerIsLoading && _searchQuery.isNotEmpty)
                    ? const Center(child: CircularProgressIndicator())
                    : filteredGroups.isEmpty
                        ? _searchQuery.isEmpty
                            ? const Center(
                                child: Text(
                                  'Bạn chưa tham gia nhóm nào',
                                  style: TextStyle(fontSize: 16),
                                ),
                              )
                            : const Center(
                                child: Text(
                                  'Không tìm thấy nhóm phù hợp',
                                  style: TextStyle(fontSize: 16),
                                ),
                              )
                        : RefreshIndicator(
                            onRefresh: _loadGroups,
                            child: ListView.builder(
                              itemCount: filteredGroups.length,
                              itemBuilder: (context, index) {
                                final group = filteredGroups[index];
                                return _buildGroupsList(group);
                              },
                            ),
                          ),
              ),
            ],
          ),
          floatingActionButton: Material(
            color: Colors.transparent,
            child: FloatingActionButton(
              heroTag: null,
              onPressed: _showCreateGroupModal,
              backgroundColor: Theme.of(context).primaryColor,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(48),
              ),
              child: const Icon(Icons.add),
            ),
          ),
          floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
        );
      },
    );
  }

  Widget _buildGroupsList(GroupDTO group) {
    return Card(
      key: ValueKey('group_card_${group.id}'),
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: ListTile(
        leading: CircleAvatar(
          radius: 24,
          backgroundColor: Colors.grey[300],
          backgroundImage: group.imageurl != null && group.imageurl!.isNotEmpty
              ? NetworkImage(group.imageurl!)
              : null,
          child: group.imageurl == null || group.imageurl!.isEmpty
              ? const Icon(Icons.groups, color: Colors.white, size: 32)
              : null,
        ),
        title: Text(
          group.name,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              group.description != null && group.description!.isNotEmpty
                  ? group.description!
                  : 'Mô tả cho ${group.name}',
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(
                  Icons.person,
                  size: 14,
                  color: Colors.grey[600],
                ),
                const SizedBox(width: 4),
                Text(
                  group.role == 'owner' || group.role == 'groupAdmin'
                      ? 'Chủ nhóm'
                      : 'Thành viên',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ],
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => GroupDetailScreen(groupId: group.id),
            ),
          ).then((updatedGroup) {
            // Khi quay lại từ GroupDetailScreen (sau khi edit)
            if (updatedGroup != null && mounted) {
              debugPrint('🔄 Nhận được updated group từ detail screen');
              // Provider đã được update, UI sẽ tự động rebuild
            }
          });
        },
      ),
    );
  }
}