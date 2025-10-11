import java.sql.*;
import java.util.Scanner;

public class ProductCRUD {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/companydb";
        String user = "root";
        String pass = "root";

        Scanner sc = new Scanner(System.in);

        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            Connection con = DriverManager.getConnection(url, user, pass);
            con.setAutoCommit(false); // For transaction handling
            System.out.println("✅ Connected to MySQL!");

            while (true) {
                System.out.println("\n--- PRODUCT MENU ---");
                System.out.println("1. Add Product");
                System.out.println("2. View All Products");
                System.out.println("3. Update Product");
                System.out.println("4. Delete Product");
                System.out.println("5. Exit");
                System.out.print("Enter choice: ");
                int ch = sc.nextInt();

                switch (ch) {
                    case 1:
                        System.out.print("Enter Product Name: ");
                        String name = sc.next();
                        System.out.print("Enter Price: ");
                        double price = sc.nextDouble();
                        System.out.print("Enter Quantity: ");
                        int qty = sc.nextInt();

                        PreparedStatement ps1 = con.prepareStatement("INSERT INTO Product (ProductName, Price, Quantity) VALUES (?, ?, ?)");
                        ps1.setString(1, name);
                        ps1.setDouble(2, price);
                        ps1.setInt(3, qty);
                        ps1.executeUpdate();
                        con.commit();
                        System.out.println("✅ Product added successfully!");
                        break;

                    case 2:
                        Statement stmt = con.createStatement();
                        ResultSet rs = stmt.executeQuery("SELECT * FROM Product");
                        System.out.println("\n--- Product List ---");
                        while (rs.next()) {
                            System.out.println("ID: " + rs.getInt("ProductID") +
                                               ", Name: " + rs.getString("ProductName") +
                                               ", Price: " + rs.getDouble("Price") +
                                               ", Qty: " + rs.getInt("Quantity"));
                        }
                        break;

                    case 3:
                        System.out.print("Enter Product ID to update: ");
                        int idu = sc.nextInt();
                        System.out.print("Enter New Price: ");
                        double newPrice = sc.nextDouble();

                        PreparedStatement ps2 = con.prepareStatement("UPDATE Product SET Price=? WHERE ProductID=?");
                        ps2.setDouble(1, newPrice);
                        ps2.setInt(2, idu);
                        int updated = ps2.executeUpdate();
                        if (updated > 0) {
                            con.commit();
                            System.out.println("✅ Product updated!");
                        } else {
                            System.out.println("❌ Product not found.");
                        }
                        break;

                    case 4:
                        System.out.print("Enter Product ID to delete: ");
                        int idd = sc.nextInt();
                        PreparedStatement ps3 = con.prepareStatement("DELETE FROM Product WHERE ProductID=?");
                        ps3.setInt(1, idd);
                        int deleted = ps3.executeUpdate();
                        if (deleted > 0) {
                            con.commit();
                            System.out.println("✅ Product deleted!");
                        } else {
                            System.out.println("❌ Product not found.");
                        }
                        break;

                    case 5:
                        con.close();
                        System.out.println("👋 Exiting program...");
                        System.exit(0);
                        break;

                    default:
                        System.out.println("⚠️ Invalid choice");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
