import java.sql.*;

public class FetchEmployeeData {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/companydb"; // Your DB name
        String user = "root"; // Your MySQL username
        String pass = "root"; // Your MySQL password

        try {
            // 1️⃣ Load MySQL JDBC Driver
            Class.forName("com.mysql.cj.jdbc.Driver");

            // 2️⃣ Establish Connection
            Connection con = DriverManager.getConnection(url, user, pass);
            System.out.println("✅ Connected to MySQL successfully!");

            // 3️⃣ Create Statement
            Statement stmt = con.createStatement();

            // 4️⃣ Execute Query
            ResultSet rs = stmt.executeQuery("SELECT * FROM Employee");

            // 5️⃣ Display Results
            System.out.println("\n--- Employee Table Data ---");
            while (rs.next()) {
                System.out.println("EmpID: " + rs.getInt("EmpID"));
                System.out.println("Name: " + rs.getString("Name"));
                System.out.println("Salary: " + rs.getDouble("Salary"));
                System.out.println("-----------------------------");
            }

            // 6️⃣ Close Connection
            con.close();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
