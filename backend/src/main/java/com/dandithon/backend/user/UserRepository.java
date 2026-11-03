package com.dandithon.backend.user;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
public interface UserRepository extends JpaRepository<GuestUser,Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from GuestUser u where u.id = :id")
    Optional<GuestUser> findForUpdate(@Param("id") long id);
}
