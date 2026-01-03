import 'dart:async';

import 'package:di_cho_tien_loi/data/dto/group_dto.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/group_provider.dart';
import './group_detail_screen.dart';

class GroupScreen extends StatefulWidget {
  const GroupScreen({super.key});

  @override
  State<GroupScreen> createState() => _GroupScreenState();
}

class _GroupScreenState extends State<GroupScreen> {
  List<GroupDTO> _groups = [];
  List<GroupDTO> _filteredGroups = [];
  bool _isLoading = true; // Dùng cho lần tải đầu tiên
  bool _isSearching = false; // Dùng riêng cho tìm kiếm
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  Timer? _searchDebounce;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadGroups();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    _searchDebounce?.cancel();
    super.dispose();
  }

  Future<void> _loadGroups() async {
    try {
      final groupProvider = context.read<GroupProvider>();
      final List<GroupDTO> groups = await groupProvider.getAllGroups();
      debugPrint("Đã cập nhật group: $groups");
      setState(() {
        _groups = groups;
        _filteredGroups = _groups;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Error loading groups: $e');
      setState(() {
        _isLoading = false;
      });
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
      _isSearching = true; // Bật trạng thái đang tìm kiếm
    });

    try {
      if (query.isEmpty) {
        setState(() {
          _filteredGroups = _groups;
          _isSearching = false;
        });
      } else {
        final results = await context.read<GroupProvider>().searchGroups(query);
        setState(() {
          _filteredGroups = results;
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
                        prefixIcon: const Icon(Icons.search, color: Colors.grey),
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
                  // Nút tìm kiếm
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
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _isSearching
                    ? const Center(child: CircularProgressIndicator()) // Loading khi tìm kiếm
                    : _filteredGroups.isEmpty
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
                        : ListView.builder(
                            itemCount: _filteredGroups.length,
                            itemBuilder: (context, index) {
                              final group = _filteredGroups[index];
                              return _buildGroupsList(group);
                            },
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildGroupsList(GroupDTO group) {
    return Card(
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
          );
        },
      ),
    );
  }
}