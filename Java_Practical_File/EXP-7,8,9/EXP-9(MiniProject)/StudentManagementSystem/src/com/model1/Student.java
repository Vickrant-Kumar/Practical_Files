package com.example.studentapp.model;

import javax.persistence.*;

@Entity
@Table(name = "students")
public class Student {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int student_id;

    private String name;
    private double balance;

    @ManyToOne
    @JoinColumn(name = "course_id")
    private Course course;

    public Student() {}

    public Student(String name, double balance) {
        this.name = name;
        this.balance = balance;
    }

    // Getters and Setters
    public int getStudent_id() { return student_id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public double getBalance() { return balance; }
    public void setBalance(double balance) { this.balance = balance; }
    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }
}
