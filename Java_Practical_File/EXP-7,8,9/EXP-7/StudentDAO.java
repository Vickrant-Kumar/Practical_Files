package controller;
import java.sql.*;
import model.Student;

public class StudentDAO {
    Connection con;

    public StudentDAO() throws Exception {
        Class.forName("com.mysql.cj.jdbc.Driver");
        con = DriverManager.getConnection("jdbc:mysql://localhost:3306/schooldb", "root", "root");
    }

    // Create
    public void addStudent(Student s) throws Exception {
        PreparedStatement ps = con.prepareStatement("INSERT INTO Student VALUES (?, ?, ?, ?)");
        ps.setInt(1, s.getStudentID());
        ps.setString(2, s.getName());
        ps.setString(3, s.getDepartment());
        ps.setDouble(4, s.getMarks());
        ps.executeUpdate();
        System.out.println("✅ Student added!");
    }

    // Read
    public void viewStudents() throws Exception {
        Statement stmt = con.createStatement();
        ResultSet rs = stmt.executeQuery("SELECT * FROM Student");
        while (rs.next()) {
            System.out.println("ID: " + rs.getInt(1) + ", Name: " + rs.getString(2) +
                               ", Dept: " + rs.getString(3) + ", Marks: " + rs.getDouble(4));
        }
    }

    // Update
    public void updateMarks(int id, double marks) throws Exception {
        PreparedStatement ps = con.prepareStatement("UPDATE Student SET Marks=? WHERE StudentID=?");
        ps.setDouble(1, marks);
        ps.setInt(2, id);
        ps.executeUpdate();
        System.out.println("✅ Marks updated!");
    }

    // Delete
    public void deleteStudent(int id) throws Exception {
        PreparedStatement ps = con.prepareStatement("DELETE FROM Student WHERE StudentID=?");
        ps.setInt(1, id);
        ps.executeUpdate();
        System.out.println("✅ Student deleted!");
    }
}
