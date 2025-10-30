package com.example;

import org.springframework.context.annotation.AnnotationConfigApplicationContext;

public class MainApp {
    public static void main(String[] args) {
        AnnotationConfigApplicationContext ctx = new AnnotationConfigApplicationContext(AppConfig.class);
        AccountService service = ctx.getBean(AccountService.class);
        service.transferMoney(101, 102, 500.0);
        ctx.close();
    }
}
