import 'package:di_cho_tien_loi/screens/group/group_screen.dart';
import 'package:flutter/material.dart';

class DeleteGroupModal extends StatelessWidget {
  final String groupName;
  final Function() onConfirmDelete;
  final bool isLoading;

  const DeleteGroupModal({
    super.key,
    required this.groupName,
    required this.onConfirmDelete,
    this.isLoading = false,
  });

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
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Icon cảnh báo
            Center(
              child: Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: const Color.fromARGB(255, 244, 67, 54),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.warning_amber_rounded,
                  size: 36,
                  color: Colors.red,
                ),
              ),
            ),
            
            const SizedBox(height: 20),
            
            // Tiêu đề
            const Text(
              'Xóa nhóm',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            
            const SizedBox(height: 12),
            
            // Nội dung
            Text(
              'Bạn có chắc chắn muốn xóa nhóm "$groupName"?',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[700],
                height: 1.5,
              ),
            ),
            
            const SizedBox(height: 8),
            
            const Text(
              'Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan đến nhóm sẽ bị xóa vĩnh viễn.',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey,
                height: 1.5,
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Nút hành động
            Row(
              children: [
                // Nút hủy
                Expanded(
                  child: OutlinedButton(
                    onPressed: isLoading ? null : () => Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(builder: (_) => const GroupScreen()),
                      (route) => false,
                      ),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      side: BorderSide(color: Colors.grey[300]!),
                    ),
                    child: const Text(
                      'Hủy',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey,
                      ),
                    ),
                  ),
                ),
                
                const SizedBox(width: 12),
                
                // Nút xóa
                Expanded(
                  child: ElevatedButton(
                    onPressed: isLoading ? null : onConfirmDelete,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      backgroundColor: Colors.red,
                      disabledBackgroundColor: Colors.red.withOpacity(0.5),
                    ),
                    child: isLoading
                        ? const SizedBox(
                            height: 24,
                            width: 24,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text(
                            'Xóa nhóm',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
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