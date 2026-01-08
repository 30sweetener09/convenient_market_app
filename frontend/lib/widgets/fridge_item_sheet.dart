import 'package:di_cho_tien_loi/providers/fridge_item_provider.dart';
import 'package:di_cho_tien_loi/providers/fridge_provider.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class FridgeItemSheet extends StatefulWidget {
  final int fridgeId;
  final int groupId;

  const FridgeItemSheet({
    super.key, 
    required this.fridgeId,
    required this.groupId, 
    required ScrollController scrollController,
  });

  @override
  State<FridgeItemSheet> createState() => FridgeItemSheetState();
}

class FridgeItemSheetState extends State<FridgeItemSheet> {
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
    return Consumer<FridgeItemProvider>(
      builder: (_, provider, _) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
          child: Column(
            //mainAxisSize: MainAxisSize.min,
            children: [
              //const SizedBox(height: 6),
              Container(
                width: 60,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[400],
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              const SizedBox(height: 12),
              Padding (
                padding: EdgeInsets.fromLTRB(16, 12, 16, 12),
                child: Text ('ABC', style: TextStyle (color: Colors.green, fontSize: 16)),
              ),
              const SizedBox(height: 12),

              if (provider.isLoadingFridgeItems)
                const CircularProgressIndicator()
              else if (provider.fridgeItems.isEmpty)
                const Text('Tủ lạnh đang trống')
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const BouncingScrollPhysics(),
                  itemCount: provider.fridgeItems.length,
                  separatorBuilder: (_, _) => const SizedBox (height: 2),
                  itemBuilder: (_, index) {
                    final item = provider.fridgeItems[index];

                    final isExpired = item.expiryDate != null &&
                        item.expiryDate!.isBefore(DateTime.now());

                    return ListTile(
                      leading: CircleAvatar(
                        backgroundImage: NetworkImage(item.imageUrl ?? ''),
                        backgroundColor: Colors.grey[200],
                      ),
                      title: Text(item.foodName!),
                      subtitle: Text(
                        '${item.quantity} ${item.unit}'
                        '${item.expiryDate != null ? ' • HSD: ${_formatDate(item.expiryDate!)}' : ''}',
                        style: TextStyle(
                          color: isExpired ? Colors.red : Colors.grey[700],
                        ),
                      ),
                      trailing: isExpired
                          ? const Icon(Icons.warning, color: Colors.red)
                          : null,
                    );
                  },
                ),
            ],
          ),
        );
      },
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}-'
        '${date.month.toString().padLeft(2, '0')}-'
        '${date.year}';
  }
}
