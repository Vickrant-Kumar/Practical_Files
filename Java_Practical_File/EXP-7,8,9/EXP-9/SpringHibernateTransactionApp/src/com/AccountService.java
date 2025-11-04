package com.example;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountService {

    @Autowired
    private AccountDAO dao;

    @Transactional
    public void transferMoney(int fromAcc, int toAcc, double amount) {
        Account sender = dao.findAccount(fromAcc);
        Account receiver = dao.findAccount(toAcc);

        sender.setBalance(sender.getBalance() - amount);
        receiver.setBalance(receiver.getBalance() + amount);

        dao.updateAccount(sender);
        dao.updateAccount(receiver);
        System.out.println("Transfer successful!");
    }
}
