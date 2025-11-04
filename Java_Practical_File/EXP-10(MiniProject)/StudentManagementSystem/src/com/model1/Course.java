package com.example.studentapp.model;

import javax.persistence.*;

@Entity
@Table(name = "courses")
public class Course {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int course_id;
    private String course_name;
    private String duration;

    public Course() {}
    public Course(String course_name, String duration) {
        this.course_name = course_name;
        this.duration = duration;
    }

    // Getters and Setters
    public int getCourse_id() { return course_id; }
    public String getCourse_name() { return course_name; }
    public void setCourse_name(String course_name) { this.course_name = course_name; }
    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }
}
