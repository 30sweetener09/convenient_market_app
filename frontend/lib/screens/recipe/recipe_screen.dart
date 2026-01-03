import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/recipe_provider.dart';
import '../../widgets/recipe_card.dart';
class RecipeScreen extends StatelessWidget {
  const RecipeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final recipes = context.watch<RecipeProvider>().recipes;

    return Scaffold(
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFF386633),
        shape: const CircleBorder(),
        onPressed: () {},
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
              child: SizedBox(
                height: 42,
                child: TextField(
                  decoration: InputDecoration(
                    hintText: 'Tìm kiếm công thức...',
                    hintStyle: const TextStyle(fontSize: 14),
                    suffixIcon: const Icon(Icons.search, size: 20),
                    filled: true,
                    fillColor: Colors.white,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                      borderSide: BorderSide(
                        color: Colors.grey.shade300, // 👈 viền thường
                        width: 1,
                      ),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                      borderSide: const BorderSide(
                        color: Color(0xFF386633), // 👈 xanh app khi focus
                        width: 1.5,
                      ),
                    ),
                  ),
                ),
              ),
            ),
            Expanded(
              child: recipes.isEmpty
                  ? const Center(child: Text("Chưa có công thức nào"))
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
