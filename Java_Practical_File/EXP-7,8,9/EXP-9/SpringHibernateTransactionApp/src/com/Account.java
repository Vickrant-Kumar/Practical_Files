package com.example;

import javax.persistence.*;

@Entity
@Table(name="account")
public class Account {
    @Id
    private int accNo;
    private String name;
    private double balance;

    public Account() {}
    public Account(int accNo, String name, double balance) {
        this.accNo = accNo;
        this.name = name;
        this.balance = balance;
    }

    // Getters and setters...
}
