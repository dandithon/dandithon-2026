package com.dandithon.backend.market;
import java.util.*;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.JpaRepository;
public interface OrderRepository extends JpaRepository<GameOrder,String> {
    Optional<GameOrder> findFirstByStoreIdAndReadyAtAfterOrderByReadyAtDesc(String storeId,LocalDateTime now);
    long countByStoreIdAndReadyAtAfter(String storeId,LocalDateTime now);
    Optional<GameOrder> findByUserIdAndRequestKey(long userId,String requestKey);
    List<GameOrder> findByUserIdOrderByOrderedAtDescIdDesc(long userId);
}
