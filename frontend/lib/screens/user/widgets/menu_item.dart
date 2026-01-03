import 'package:flutter/material.dart';

class MenuItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final VoidCallback onTap;
  final Color? color;

  const MenuItem ({
    super.key,
    required this.icon,
    required this.title,
    required this.description,
    required this.onTap,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: color ?? Colors.black, size: 30),
      title: Column (
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
        Text (title, style: TextStyle(color:  Colors.black, fontSize: 20, fontWeight: FontWeight.w700)),
        Text (description, style: TextStyle(color:  const Color.fromARGB(255, 47, 47, 47), fontSize: 12, fontWeight: FontWeight.normal)),
        SizedBox (height: 6),
      ],),
      onTap: onTap,
    );
  }
}