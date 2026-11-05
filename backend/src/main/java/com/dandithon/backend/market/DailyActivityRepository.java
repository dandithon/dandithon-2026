package com.dandithon.backend.market;
import java.time.LocalDate;
import org.springframework.data.jpa.repository.JpaRepository;
public interface DailyActivityRepository extends JpaRepository<DailyActivity,String> {
    long countByUserIdAndActivityDayAndKind(long userId,LocalDate day,String kind);
}
