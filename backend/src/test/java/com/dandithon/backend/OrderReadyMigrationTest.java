package com.dandithon.backend;

import java.sql.*;
import java.time.LocalDateTime;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class OrderReadyMigrationTest {
    @Test void v5PreservesExistingOrdersAndTheirLegacyCompletionTime()throws Exception {
        String url="jdbc:h2:mem:eta-migration;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";
        Flyway.configure().dataSource(url,"sa","").target("4").load().migrate();
        try(var connection=DriverManager.getConnection(url,"sa","");var sql=connection.createStatement()) {
            sql.executeUpdate("insert into app_users values(1,'승우',700,1,0,100)");
            sql.executeUpdate("insert into game_orders values('legacy',1,'seomun','서문분식','legacy-key','signature',300,700,TIMESTAMP '2026-11-05 12:00:00',false)");
        }
        Flyway.configure().dataSource(url,"sa","").load().migrate();
        try(var connection=DriverManager.getConnection(url,"sa","");var sql=connection.createStatement();var result=sql.executeQuery("select ready_at,eta_model_version,remaining_balance,request_key from game_orders where id='legacy'")) {
            assertThat(result.next()).isTrue();
            assertThat(result.getTimestamp(1).toLocalDateTime()).isEqualTo(LocalDateTime.of(2026,11,5,12,0,15));
            assertThat(result.getString(2)).isNull();assertThat(result.getLong(3)).isEqualTo(700);assertThat(result.getString(4)).isEqualTo("legacy-key");
        }
    }
}
