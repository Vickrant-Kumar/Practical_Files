package com.example;

import org.springframework.context.annotation.*;

public class MainApp {
    public static void main(String[] args) {
        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class);
        Student s = context.getBean(Student.class);
        s.showDetails();
        context.close();
    }
}
