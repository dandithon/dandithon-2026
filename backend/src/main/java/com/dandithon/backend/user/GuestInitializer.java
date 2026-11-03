package com.dandithon.backend.user;
import org.springframework.stereotype.Component;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.transaction.annotation.Transactional;
@Component
public class GuestInitializer implements ApplicationRunner {
    private final UserRepository users;
    public GuestInitializer(UserRepository users) { this.users=users; }
    @Override @Transactional
    public void run(ApplicationArguments args) {
        if(!users.existsById(1L)) users.save(new GuestUser(1L));
    }
}
