import 'package:flutter/material.dart';

class CustomDropdownField extends StatelessWidget {
  final String label;
  final List<String> items;
  final String? value;
  final void Function(String?)? onChanged;
  final String? Function(String?)? validator;
  final TextEditingController controller;

  const CustomDropdownField({
    super.key,
    required this.label,
    required this.items,
    this.value,
    this.onChanged,
    this.validator,
    required this.controller,
  });

  @override
  Widget build(BuildContext context) {
    return DropdownMenu<String>(
      controller: controller,
      initialSelection: value,
      label: Text(label),
      dropdownMenuEntries: items
          .map((item) => DropdownMenuEntry<String>(
                value: item,
                label: item,
              ))
          .toList(),
      onSelected: onChanged,
    );
  }
}