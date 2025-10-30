package com.example.studentapp.service;

import com.example.studentapp.dao.StudentDAO;
import com.example.studentapp.model.Student;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FeeService {

    @Autowired
    private StudentDAO dao;

    @Transactional
    public void payFees(int studentId, double amount) {
        Student s = dao.getStudentById(studentId);
        if (s == null) {
            throw new RuntimeException("Student not found!");
        }
        if (s.getBalance() < amount) {
            throw new RuntimeException("Insufficient balance!");
        }

        s.setBalance(s.getBalance() - amount);
        dao.updateStudent(s);
        System.out.println("Fee payment successful!");
    }

    @Transactional
    public void refundFees(int studentId, double amount) {
        Student s = dao.getStudentById(studentId);
        if (s == null) {
            throw new RuntimeException("Student not found!");
        }

        s.setBalance(s.getBalance() + amount);
        dao.updateStudent(s);
        System.out.println("Refund successful!");
    }
}
