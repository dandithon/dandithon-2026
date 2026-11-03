package com.dandithon.backend.market;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface OrderRepository extends JpaRepository<GameOrder,String> {
    Optional<GameOrder> findByUserIdAndRequestKey(long userId,String requestKey);
    List<GameOrder> findByUserIdOrderByOrderedAtDescIdDesc(long userId);
}
