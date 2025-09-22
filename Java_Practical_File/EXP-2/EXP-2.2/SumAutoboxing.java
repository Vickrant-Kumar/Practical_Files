// File: SumAutoboxing.java
import java.util.Scanner;

public class SumAutoboxing {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        System.out.print("Enter first integer: ");
        int a = sc.nextInt();

        System.out.print("Enter second integer: ");
        int b = sc.nextInt();

        // Autoboxing: primitive to wrapper
        Integer num1 = a;
        Integer num2 = b;

        // Unboxing: wrapper to primitive
        int sum = num1 + num2;

        System.out.println("Sum = " + sum);

        sc.close();
    }
}
