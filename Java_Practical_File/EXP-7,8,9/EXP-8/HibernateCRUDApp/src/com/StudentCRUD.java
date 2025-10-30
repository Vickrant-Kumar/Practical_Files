package com.example;

import org.hibernate.*;

public class StudentCRUD {
    public static void main(String[] args) {
        SessionFactory factory = HibernateUtil.getSessionFactory();
        Session session = factory.openSession();
        Transaction tx = session.beginTransaction();

        // CREATE
        Student s1 = new Student("Vickrant", 21);
        session.save(s1);

        // READ
        Student s2 = session.get(Student.class, 1);
        System.out.println("Student: " + s2.getName());

        // UPDATE
        s2.setAge(22);
        session.update(s2);

        // DELETE
        session.delete(s2);

        tx.commit();
        session.close();
        System.out.println("CRUD operations done!");
    }
}
