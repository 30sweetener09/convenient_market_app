import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/food_provider.dart';
import '../../widgets/food_card.dart';
import 'food_form_dialog.dart';

class FoodScreen extends StatefulWidget {
  const FoodScreen({super.key});

  @override
  State<FoodScreen> createState() => _FoodScreenState();
}

class _FoodScreenState extends State<FoodScreen> {
  final TextEditingController _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();

    /// gọi API sau frame đầu
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FoodProvider>().fetchFoods();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  // ================= SEARCH =================
  void _onSearch() {
    final keyword = _searchCtrl.text.trim();

    if (keyword.isEmpty) {
      context.read<FoodProvider>().fetchFoods();
    } else {
      context.read<FoodProvider>().searchFoods(keyword);
    }
  }

  void _clearSearch() {
    _searchCtrl.clear();
    context.read<FoodProvider>().fetchFoods();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<FoodProvider>();
    final foods = provider.foods;

    return Scaffold(
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFF386633),
        shape: const CircleBorder(),
        onPressed: () async {
          final result = await showDialog(
            context: context,
            builder: (_) => const FoodFormDialog(),
          );

          if (result == true && mounted) {
            context.read<FoodProvider>().fetchFoods();
          }
        },
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // 🔍 SEARCH BAR (GIỐNG RECIPE)
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _searchCtrl,
                      textInputAction: TextInputAction.search,
                      onSubmitted: (_) => _onSearch(),
                      decoration: InputDecoration(
                        hintText: 'Nhập tên thực phẩm...',
                        filled: true,
                        fillColor: Colors.white,
                        contentPadding:
                        const EdgeInsets.symmetric(horizontal: 16),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide:
                          BorderSide(color: Colors.grey.shade300),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: const BorderSide(
                            color: Color(0xFF386633),
                            width: 1.5,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),

                  /// SEARCH BUTTON
                  IconButton(
                    onPressed: provider.isLoading ? null : _onSearch,
                    icon: const Icon(Icons.search),
                    color: const Color(0xFF386633),
                  ),

                  /// CLEAR BUTTON
                  if (_searchCtrl.text.isNotEmpty)
                    IconButton(
                      onPressed:
                      provider.isLoading ? null : _clearSearch,
                      icon: const Icon(Icons.clear),
                      color: Colors.grey,
                    ),
                ],
              ),
            ),

            // 📋 LIST
            Expanded(
              child: provider.isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : foods.isEmpty
                  ? const Center(
                child: Text("Không có thực phẩm nào"),
              )
                  : ListView.builder(
                padding: const EdgeInsets.only(bottom: 80),
                itemCount: foods.length,
                itemBuilder: (_, i) =>
                    FoodCard(food: foods[i]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
