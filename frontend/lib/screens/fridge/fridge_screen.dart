import 'package:flutter/material.dart';

class FridgeScreen extends StatefulWidget {
  const FridgeScreen({super.key});

  @override
  State<FridgeScreen> createState() => _FridgeScreenState();
}

class _FridgeScreenState extends State<FridgeScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Fridge Screen'),
      ),
      body: const Center(
        child: Text('Welcome to the Fridge Screen!'),
      ),
    );
  }
}