import 'package:flutter/material.dart';

class CustomBottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const CustomBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    const double barHeight = 56;
    const double activeOffset = 18;

    final icons = [
      Icons.group,
      Icons.menu_book,
      Icons.home,
      Icons.kitchen,
      Icons.bar_chart,
    ];

    return SizedBox(
      height: barHeight + activeOffset,
      child: Stack(
        alignment: Alignment.bottomCenter,
        children: [
          // Thanh bar
          Container(
            height: barHeight,
            decoration: const BoxDecoration(
              color: Color(0xFF386633),
            ),
          ),

          // Icons
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(icons.length, (i) {
              final isActive = currentIndex == i;

              return GestureDetector(
                onTap: () => onTap(i),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 0),
                  transform: Matrix4.translationValues(
                    0,
                    isActive ? -activeOffset : 0,
                    0,
                  ),
                  padding: const EdgeInsets.all(10),
                  decoration: isActive
                      ? BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0xFF4E7C4A),
                    border: Border.all(color: Colors.white, width: 2),
                  )
                      : null,
                  child: Icon(
                    icons[i],
                    color: Colors.white,
                    size: isActive ? 28 : 24,
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}
