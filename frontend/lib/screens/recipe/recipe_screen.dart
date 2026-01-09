import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/recipe_provider.dart';
import '../../widgets/recipe_card.dart';
import 'recipe_form_screen.dart';

class RecipeScreen extends StatefulWidget {
  const RecipeScreen({super.key});

  @override
  State<RecipeScreen> createState() => _RecipeScreenState();
}

class _RecipeScreenState extends State<RecipeScreen> {
  final TextEditingController _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();

    /// gọi API sau frame đầu
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<RecipeProvider>().fetchRecipes();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _onSearch() {
    final keyword = _searchCtrl.text.trim();

    if (keyword.isEmpty) {
      context.read<RecipeProvider>().fetchRecipes();
    } else {
      context.read<RecipeProvider>().searchRecipes(keyword);
    }
  }

  void _clearSearch() {
    _searchCtrl.clear();
    context.read<RecipeProvider>().fetchRecipes();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<RecipeProvider>();
    final recipes = provider.recipes;

    return Scaffold(
      floatingActionButton: FloatingActionButton(
        heroTag: null,
        backgroundColor: const Color(0xFF386633),
        shape: const CircleBorder(),
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const RecipeFormScreen()),
          );

          if (result == true && mounted) {
            context.read<RecipeProvider>().fetchRecipes();
          }
        },
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // 🔍 SEARCH BAR
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
                        hintText: 'Nhập tên công thức...',
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
                      onPressed: provider.isLoading ? null : _clearSearch,
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
                  : recipes.isEmpty
                  ? const Center(
                child: Text("Không có công thức nào"),
              )
                  : ListView.builder(
                padding: const EdgeInsets.only(bottom: 80),
                itemCount: recipes.length,
                itemBuilder: (_, i) =>
                    RecipeCard(recipe: recipes[i]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
