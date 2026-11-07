package com.dandithon.backend;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.*;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.support.TransactionTemplate;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class GuestIsolationIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private org.springframework.transaction.PlatformTransactionManager manager;

    @Autowired
    private com.dandithon.backend.user.UserRepository users;

    private final HttpClient client = HttpClient.newHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    @BeforeEach
    void reset() {
        var tx = new TransactionTemplate(manager);
        tx.executeWithoutResult(s -> {
            for (String table : List.of("daily_activities", "review_images", "game_reviews", "order_lines", "game_orders", "quest_claims", "food_progress", "purchase_events")) {
                jdbc.update("delete from " + table);
            }
            users.deleteAll();
            users.saveAndFlush(new com.dandithon.backend.user.GuestUser(1L));
        });
    }

    private HttpResponse<String> send(String method, String path, String body, Long userId, String idempotencyKey) throws Exception {
        var builder = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + "/api/v1" + path));
        builder.header("Content-Type", "application/json");
        if (userId != null) {
            builder.header("X-User-Id", String.valueOf(userId));
        }
        if (idempotencyKey != null) {
            builder.header("Idempotency-Key", idempotencyKey);
        }
        return client.send(builder.method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body)).build(),
                HttpResponse.BodyHandlers.ofString());
    }

    private JsonNode json(HttpResponse<String> response, int expectedStatus) throws Exception {
        assertThat(response.statusCode()).as(response.body()).isEqualTo(expectedStatus);
        return mapper.readTree(response.body());
    }

    @Test
    void multiGuestProfilesAreCompletelyIsolated() throws Exception {
        // 1. Default user (1) starts with 1000
        var user1 = json(send("GET", "/users/me", null, 1L, null), 200).path("data");
        assertThat(user1.path("userId").asLong()).isEqualTo(1L);
        assertThat(user1.path("balance").asLong()).isEqualTo(1000L);

        // 2. Guest 2 auto-provisioned with 1000
        var user2 = json(send("GET", "/users/me", null, 2L, null), 200).path("data");
        assertThat(user2.path("userId").asLong()).isEqualTo(2L);
        assertThat(user2.path("balance").asLong()).isEqualTo(1000L);

        // 3. Guest 2 charges 50,000 coins
        var charged2 = json(send("POST", "/users/me/charge", "{\"amount\":50000}", 2L, null), 200).path("data");
        assertThat(charged2.path("balance").asLong()).isEqualTo(51000L);

        // User 1 balance is still 1000
        var recheckUser1 = json(send("GET", "/users/me", null, 1L, null), 200).path("data");
        assertThat(recheckUser1.path("balance").asLong()).isEqualTo(1000L);

        // 4. Guest 2 toggles favorite store
        var fav2 = json(send("PATCH", "/users/me/favorites/seomun", null, 2L, null), 200).path("data");
        assertThat(fav2.path("favorite").asBoolean()).isTrue();

        // User 1 has no favorites
        var fav1 = json(send("GET", "/users/me/favorites", null, 1L, null), 200).path("data");
        assertThat(fav1.path("favorites").size()).isZero();

        // 5. Guest 2 places an order
        String orderBody = """
            {"storeId":"seomun","items":[{"menuId":"tteok","quantity":1}]}
            """;
        var order2 = json(send("POST", "/orders", orderBody, 2L, "key-guest-2-ord1"), 200).path("data");
        assertThat(order2.path("remainingBalance").asLong()).isEqualTo(50700L);

        // User 1 receipts should be empty
        var receipts1 = json(send("GET", "/orders/receipts", null, 1L, null), 200).path("data");
        assertThat(receipts1.path("receipts").size()).isZero();

        // Guest 2 has 1 receipt
        var receipts2 = json(send("GET", "/orders/receipts", null, 2L, null), 200).path("data");
        assertThat(receipts2.path("receipts").size()).isEqualTo(1);

        // 6. Resetting Guest 2 does NOT affect User 1
        json(send("POST", "/demo/reset", null, 2L, null), 200);

        var resetUser2 = json(send("GET", "/users/me", null, 2L, null), 200).path("data");
        assertThat(resetUser2.path("balance").asLong()).isEqualTo(1000L);

        // User 1 balance is still intact
        var finalUser1 = json(send("GET", "/users/me", null, 1L, null), 200).path("data");
        assertThat(finalUser1.path("balance").asLong()).isEqualTo(1000L);
    }
}
