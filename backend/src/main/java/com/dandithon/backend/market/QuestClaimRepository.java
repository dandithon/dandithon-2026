package com.dandithon.backend.market;
import org.springframework.data.jpa.repository.JpaRepository;
public interface QuestClaimRepository extends JpaRepository<QuestClaim,String> {
    void deleteByUserId(long userId);
}
