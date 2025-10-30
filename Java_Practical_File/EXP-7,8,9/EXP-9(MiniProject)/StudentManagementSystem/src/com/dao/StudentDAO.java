package com.example.studentapp.dao;

import com.example.studentapp.model.Student;
import org.hibernate.*;
import org.springframework.stereotype.Repository;
import javax.persistence.PersistenceContext;
import javax.persistence.EntityManager;
import java.util.List;

@Repository
public class StudentDAO {
    @PersistenceContext
    private EntityManager em;

    public void addStudent(Student s) {
        em.persist(s);
    }

    public Student getStudentById(int id) {
        return em.find(Student.class, id);
    }

    public List<Student> getAllStudents() {
        return em.createQuery("from Student", Student.class).getResultList();
    }

    public void updateStudent(Student s) {
        em.merge(s);
    }

    public void deleteStudent(int id) {
        Student s = getStudentById(id);
        if (s != null) em.remove(s);
    }
}
