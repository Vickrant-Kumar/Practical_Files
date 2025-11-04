package com.example;

import org.hibernate.*;
import org.springframework.stereotype.Repository;
import javax.persistence.*;

@Repository
public class AccountDAO {
    @PersistenceContext
    private EntityManager em;

    public Account findAccount(int id) {
        return em.find(Account.class, id);
    }

    public void updateAccount(Account acc) {
        em.merge(acc);
    }
}
