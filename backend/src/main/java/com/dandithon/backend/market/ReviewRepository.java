package com.dandithon.backend.market;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ReviewRepository extends JpaRepository<GameReview,String> {
    List<GameReview> findByStoreIdOrderByCreatedAtDescIdDesc(String storeId);
    List<GameReview> findByUserId(long userId);
    void deleteByUserId(long userId);
    long countByUserIdAndStoreIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(long userId,String storeId,LocalDateTime start,LocalDateTime end);
}
