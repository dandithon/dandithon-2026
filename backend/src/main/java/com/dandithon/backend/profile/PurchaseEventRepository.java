package com.dandithon.backend.profile;
import org.springframework.data.jpa.repository.JpaRepository;
public interface PurchaseEventRepository extends JpaRepository<PurchaseEvent,String> {
    void deleteByUserId(long userId);
}
