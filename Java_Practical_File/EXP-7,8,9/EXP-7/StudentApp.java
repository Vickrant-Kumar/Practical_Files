package view;
import java.util.*;
import model.Student;
import controller.StudentDAO;

public class StudentApp {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        try {
            StudentDAO dao = new StudentDAO();

            while (true) {
                System.out.println("\n--- STUDENT MENU ---");
                System.out.println("1. Add Student");
                System.out.println("2. View Students");
                System.out.println("3. Update Marks");
                System.out.println("4. Delete Student");
                System.out.println("5. Exit");
                System.out.print("Enter choice: ");
                int ch = sc.nextInt();

                switch (ch) {
                    case 1:
                        System.out.print("Enter ID: ");
                        int id = sc.nextInt();
                        System.out.print("Enter Name: ");
                        String name = sc.next();
                        System.out.print("Enter Dept: ");
                        String dept = sc.next();
                        System.out.print("Enter Marks: ");
                        double marks = sc.nextDouble();

                        Student s = new Student(id, name, dept, marks);
                        dao.addStudent(s);
                        break;

                    case 2:
                        dao.viewStudents();
                        break;

                    case 3:
                        System.out.print("Enter Student ID: ");
                        int uid = sc.nextInt();
                        System.out.print("Enter New Marks: ");
                        double newMarks = sc.nextDouble();
                        dao.updateMarks(uid, newMarks);
                        break;

                    case 4:
                        System.out.print("Enter Student ID: ");
                        int did = sc.nextInt();
                        dao.deleteStudent(did);
                        break;

                    case 5:
                        System.out.println("👋 Exiting...");
                        System.exit(0);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
