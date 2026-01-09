import 'package:di_cho_tien_loi/providers/fridge_item_provider.dart';
import 'package:di_cho_tien_loi/screens/fridge/add_item.dart';
import 'package:di_cho_tien_loi/screens/fridge/item_card.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class FridgeDetailScreen extends StatefulWidget {
  final int fridgeId;
  final int groupId;
  final String fridgeName;

  const FridgeDetailScreen({
    super.key,
    required this.fridgeId,
    required this.groupId,
    required this.fridgeName,
  });

  @override
  State<FridgeDetailScreen> createState() => _FridgeDetailScreenState();
}

class _FridgeDetailScreenState extends State<FridgeDetailScreen> {
  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FridgeItemProvider>().fetchAllItems(
        fridgeId: widget.fridgeId,
        groupId: widget.groupId,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Color(0xFF396A30),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          "Tủ lạnh: ${widget.fridgeName}",
          style: TextStyle(color: Colors.white),
        ),
        centerTitle: true,
      ),
      body: Consumer<FridgeItemProvider>(
        builder: (_, provider, _) {
          if (provider.isLoadingFridgeItems) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.fridgeItems.isEmpty) {
            return const Center(child: Text('Tủ lạnh đang trống'));
          }

          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            itemCount: provider.fridgeItems.length,
            separatorBuilder: (_, _) => const SizedBox(height: 6),
            itemBuilder: (_, index) {
              final item = provider.fridgeItems[index];
              return ItemCard(
                item: item,
                onDelete: () {
                  final provider = context.read<FridgeItemProvider>();
                  //provider.removeLocalItem(item.id);
                  provider.deleteItem(item.id, item.foodName!, widget.fridgeId);
                  /*
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Đã xoá ${item.foodName}'),
                      backgroundColor: Colors.red,
                    ),
                  );*/
                },
              );
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        heroTag: 'items_screen_fab',
        backgroundColor: const Color(0xFF396A30),
        onPressed: _openAddItemSheet,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}-'
        '${date.month.toString().padLeft(2, '0')}-'
        '${date.year}';
  }

  void _openAddItemSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
          child: AddItemSheet(
            fridgeId: widget.fridgeId,
            groupId: widget.groupId,
          ),
        );
      },
    );
  }
}
