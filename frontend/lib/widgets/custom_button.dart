import 'package:flutter/material.dart';

class CustomButton extends StatelessWidget {
  final String label;
  final VoidCallback onPressed;
  final bool loading;
  final Color? backgroundColor;
  final Color? textColor;

  const CustomButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.loading = false,
    this.backgroundColor = Colors.black,
    this.textColor = Colors.white,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: loading ? null : onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: backgroundColor,
        minimumSize: const Size.fromHeight(56),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
        
      ),
      child: loading
          ? const CircularProgressIndicator(color: Colors.white)
          : Text(
              label, 
              style: TextStyle(
                fontSize: 24, 
                color: textColor, 
                fontFamily: 'Nunito', 
                fontWeight: FontWeight.w700
                )
              ),
    );
  }
}
