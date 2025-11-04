package com.example.studentapp;

import com.example.studentapp.config.AppConfig;
import com.example.studentapp.dao.StudentDAO;
import com.example.studentapp.model.Student;
import com.example.studentapp.service.FeeService;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

import java.util.List;
import java.util.Scanner;

public class MainApp {
    public static void main(String[] args) {
        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class);
        StudentDAO dao = context.getBean(StudentDAO.class);
        FeeService service = context.getBean(FeeService.class);

        Scanner sc = new Scanner(System.in);
        while (true) {
            System.out.println("\n=== STUDENT MANAGEMENT MENU ===");
            System.out.println("1. Add Student");
            System.out.println("2. View All Students");
            System.out.println("3. Pay Fees");
            System.out.println("4. Refund Fees");
            System.out.println("5. Delete Student");
            System.out.println("6. Exit");
            System.out.print("Enter choice: ");
            int choice = sc.nextInt();

            if (choice == 1) {
                System.out.print("Enter name: ");
                String name = sc.next();
                System.out.print("Enter balance: ");
                double bal = sc.nextDouble();
                dao.addStudent(new Student(name, bal));
                System.out.println("Student added successfully!");

            } else if (choice == 2) {
                List<Student> list = dao.getAllStudents();
                for (Student s : list) {
                    System.out.println(s.getStudent_id() + " | " + s.getName() + " | Balance: " + s.getBalance());
                }

            } else if (choice == 3) {
                System.out.print("Enter student ID: ");
                int id = sc.nextInt();
                System.out.print("Enter amount to pay: ");
                double amt = sc.nextDouble();
                try {
                    service.payFees(id, amt);
                } catch (Exception e) {
                    System.out.println("Error: " + e.getMessage());
                }

            } else if (choice == 4) {
                System.out.print("Enter student ID: ");
                int id = sc.nextInt();
                System.out.print("Enter refund amount: ");
                double amt = sc.nextDouble();
                try {
                    service.refundFees(id, amt);
                } catch (Exception e) {
                    System.out.println("Error: " + e.getMessage());
                }

            } else if (choice == 5) {
                System.out.print("Enter ID to delete: ");
                int id = sc.nextInt();
                dao.deleteStudent(id);
                System.out.println("Student deleted!");

            } else if (choice == 6) {
                System.out.println("Goodbye!");
                break;
            }
        }

        context.close();
        sc.close();
    }
}
