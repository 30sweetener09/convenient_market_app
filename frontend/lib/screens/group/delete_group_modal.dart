import 'package:flutter/material.dart';
class DeleteGroupModal extends StatefulWidget {
  final String groupName;
  final Future<bool> Function()? onConfirmDelete; // Đổi thành async
  final bool isLoading;

  const DeleteGroupModal({
    super.key,
    required this.groupName,
    this.onConfirmDelete,
    this.isLoading = false,
  });

  @override
  State<DeleteGroupModal> createState() => _DeleteGroupModalState();
}

class _DeleteGroupModalState extends State<DeleteGroupModal> {
  bool _isProcessing = false;

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // ... (phần icon, tiêu đề, nội dung giữ nguyên)
            
            const SizedBox(height: 24),
            
            // Nút hành động
            Row(
              children: [
                // Nút hủy
                Expanded(
                  child: OutlinedButton(
                    onPressed: (_isProcessing || widget.isLoading) 
                        ? null 
                        : () => Navigator.pop(context),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      side: BorderSide(color: Colors.grey[300]!),
                    ),
                    child: const Text('Hủy'),
                  ),
                ),
                
                const SizedBox(width: 12),
                
                // Nút xóa
                Expanded(
                  child: ElevatedButton(
                    onPressed: (_isProcessing || widget.isLoading) 
                        ? null 
                        : () async {
                          setState(() => _isProcessing = true);
                          
                          if (widget.onConfirmDelete != null) {
                            final result = await widget.onConfirmDelete!();
                            if (result && mounted) {
                              Navigator.pop(context, true);
                            }
                          } else {
                            Navigator.pop(context, true);
                          }
                        },
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      backgroundColor: Colors.red,
                    ),
                    child: (_isProcessing || widget.isLoading)
                        ? const SizedBox(
                            height: 24,
                            width: 24,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text('Xóa nhóm'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}