package com.dandithon.backend.market;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
public interface DemoQueueRepository extends JpaRepository<DemoQueueOrder,String> {
    Optional<DemoQueueOrder> findFirstByReadyAtAfterOrderByReadyAtDesc(LocalDateTime now);
    long countByReadyAtAfter(LocalDateTime now);
}
