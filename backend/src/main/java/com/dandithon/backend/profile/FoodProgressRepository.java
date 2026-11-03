package com.dandithon.backend.profile;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
public interface FoodProgressRepository extends JpaRepository<FoodProgress,String> {
    List<FoodProgress> findByUserId(long userId);
    Optional<FoodProgress> findByUserIdAndFoodId(long userId,String foodId);
}
