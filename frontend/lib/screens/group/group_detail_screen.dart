import 'package:di_cho_tien_loi/data/dto/group_dto.dart';
import 'package:flutter/material.dart';

class GroupDetailScreen extends StatefulWidget {
  final String groupId;

  const GroupDetailScreen({super.key, required this.groupId});

  @override
  State<GroupDetailScreen> createState() => _GroupDetailScreenState();
}

class _GroupDetailScreenState extends State<GroupDetailScreen> {
  
  GroupDTO? _group;
  bool _isLoading = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_group?.name ?? 'Chi tiết nhóm'),
        
      ),
      body: Column(
      children: [
        Hero(
          // Dùng cùng tag với màn hình trước
          tag: 'group-avatar-${_group?.id}',
          child: CircleAvatar(
            radius: 50,
            backgroundImage: _group?.imageurl != null 
                ? NetworkImage(_group!.imageurl!)
                : null,
            child: _group?.imageurl == null 
                ? const Icon(Icons.groups, size: 60)
                : null,
          ),
        ),
        // ... rest of the code
      ],
    ),
    );
  }

}