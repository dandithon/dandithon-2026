package com.dandithon.backend;

import com.dandithon.backend.profile.*;
import com.dandithon.backend.user.*;
import java.net.URI;
import java.net.http.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class Be1IntegrationTest {
    @LocalServerPort int port;
    @Autowired UserRepository users;
    @Autowired org.springframework.jdbc.core.JdbcTemplate jdbc;
    @Autowired FoodProgressRepository counts;
    @Autowired PurchaseEventRepository events;
    @Autowired GuestInitializer initializer;
    @Autowired PurchaseProgressService purchases;
    @Autowired PlatformTransactionManager manager;
    final HttpClient client=HttpClient.newHttpClient();
    final ObjectMapper mapper=new ObjectMapper();
    TransactionTemplate tx;

    @BeforeEach void reset() {
        tx=new TransactionTemplate(manager);
        tx.executeWithoutResult(s->{for(String table:List.of("daily_activities","review_images","game_reviews","order_lines","game_orders","quest_claims"))jdbc.update("delete from "+table);events.deleteAll();counts.deleteAll();users.deleteAll();users.saveAndFlush(new GuestUser(1));});
    }
    HttpResponse<String> request(String method,String path,String body) throws Exception {
        var builder=HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+path));
        builder.header("Content-Type","application/json");
        return client.send(builder.method(method,body==null?HttpRequest.BodyPublishers.noBody():HttpRequest.BodyPublishers.ofString(body)).build(),HttpResponse.BodyHandlers.ofString());
    }
    JsonNode json(HttpResponse<String> response,int status) {
        assertThat(response.statusCode()).as(response.body()).isEqualTo(status);
        return mapper.readTree(response.body());
    }
    JsonNode get(String path) throws Exception {return json(request("GET","/api/v1"+path,null),200).path("data");}
    JsonNode tteok() throws Exception { return get("/profile/badges").path("foods").get(0); }
    void buy(String event,String food) { tx.executeWithoutResult(s->purchases.recordSuccessfulPurchase(1,event,food)); }

    @Test void freshGuestHasNoInventedPurchasesOrEquipment() throws Exception {
        var data=get("/users/me");
        assertThat(data.path("userId").asLong()).isEqualTo(1);
        assertThat(data.path("nickname").asText()).isEqualTo("승우");
        assertThat(data.path("balance").asLong()).isEqualTo(1000);
        assertThat(data.path("exp").asLong()).isZero();
        assertThat(data.path("equipped").path("head").isNull()).isTrue();
        assertThat(get("/profile/equipments").path("equipments").size()).isEqualTo(4);
        assertThat(tteok().path("purchaseCount").asLong()).isZero();
        assertThat(tteok().path("nextBadge").path("remainingCount").asLong()).isEqualTo(3);
    }
    @Test void renamePersistsAndStartupNeverResetsExistingUser() throws Exception {
        json(request("PATCH","/api/v1/users/me/nickname","{\"nickname\":\"  시장왕  \"}"),200);
        jdbc.update("update app_users set balance=725 where id=1");
        initializer.run(null);
        assertThat(get("/users/me").path("nickname").asText()).isEqualTo("시장왕");
        assertThat(users.count()).isEqualTo(1);
        assertThat(get("/users/me").path("balance").asLong()).isEqualTo(725);
    }
    @Test void renameRejectsInvalidPayloads() throws Exception {
        for(String body:List.of("{}","null","{\"nickname\":null}","{\"nickname\":\"   \"}","{\"nickname\":\"123456789\"}","{","{\"nickname\":\"a\\n b\"}")) {
            var result=json(request("PATCH","/api/v1/users/me/nickname",body),400);
            assertThat(result.path("success").asBoolean()).isFalse();
            assertThat(result.path("data").isNull()).isTrue();
            assertThat(result.path("error").path("code").asText()).isEqualTo("INVALID_INPUT_VALUE");
        }
        assertThat(get("/users/me").path("nickname").asText()).isEqualTo("승우");
    }
    @Test void nicknameCountsUnicodeCodePoints() throws Exception {
        json(request("PATCH","/api/v1/users/me/nickname","{\"nickname\":\"😀😀😀😀😀😀😀😀\"}"),200);
        json(request("PATCH","/api/v1/users/me/nickname","{\"nickname\":\"😀😀😀😀😀😀😀😀😀\"}"),400);
    }
    @Test void lockedAndUnknownEquipmentDoNotChangeUser() throws Exception {
        assertThat(json(request("PATCH","/api/v1/profile/equipments/tteok-hat/toggle",null),400).path("error").path("code").asText()).isEqualTo("EQUIPMENT_LOCKED");
        json(request("PATCH","/api/v1/profile/equipments/missing/toggle",null),400);
        assertThat(get("/users/me").path("equipped").path("head").isNull()).isTrue();
    }
    @Test void purchasesUnlockAtExactThresholdsAndBadgesStopAtGold() throws Exception {
        for(int n=1;n<=10;n++) {
            buy("line-"+n,"tteok");
            var items=get("/profile/equipments").path("equipments");
            int[] thresholds={1,3,5,8};
            for(int i=0;i<4;i++)assertThat(items.get(i).path("unlocked").asBoolean()).isEqualTo(n>=thresholds[i]);
            var badges=tteok().path("badges");
            int[] badgeThresholds={3,5,10};
            for(int i=0;i<3;i++)assertThat(badges.get(i).path("earned").asBoolean()).isEqualTo(n>=badgeThresholds[i]);
        }
        assertThat(tteok().path("nextBadge").isNull()).isTrue();
        assertThat(get("/users/me").path("balance").asLong()).isEqualTo(1000);
        assertThat(get("/users/me").path("exp").asLong()).isZero();
    }
    @Test void equipAndUnequipPersistWithoutChangingCounts() throws Exception {
        buy("hat-line","tteok");
        json(request("PATCH","/api/v1/profile/equipments/tteok-hat/toggle",null),200);
        assertThat(get("/users/me").path("equipped").path("head").asText()).isEqualTo("tteok-hat");
        assertThat(get("/profile/equipments").path("equipments").get(0).path("isEquipped").asBoolean()).isTrue();
        json(request("PATCH","/api/v1/profile/equipments/tteok-hat/toggle",null),200);
        assertThat(get("/users/me").path("equipped").path("head").isNull()).isTrue();
        assertThat(tteok().path("purchaseCount").asLong()).isEqualTo(1);
    }
    @Test void repeatEventIsIdempotentButConflictingReuseFails() throws Exception {
        buy("same","tteok");buy("same","tteok");
        assertThat(tteok().path("purchaseCount").asLong()).isEqualTo(1);
        assertThatThrownBy(()->buy("same","fish")).hasMessageContaining("식별자");
        assertThat(events.count()).isEqualTo(1);
    }
    @Test void purchaseProgressRollsBackWithOrderTransaction() throws Exception {
        assertThatThrownBy(()->tx.executeWithoutResult(s->{purchases.recordSuccessfulPurchase(1,"rollback","tteok");throw new IllegalStateException("order failed");})).isInstanceOf(IllegalStateException.class);
        assertThat(events.count()).isZero();
        assertThat(tteok().path("purchaseCount").asLong()).isZero();
        assertThatThrownBy(()->purchases.recordSuccessfulPurchase(1,"no-tx","tteok")).isInstanceOf(org.springframework.transaction.IllegalTransactionStateException.class);
    }
    @Test void concurrentPurchasesDoNotLoseCountsOrDoubleCountRetries() throws Exception {
        try(var executor=Executors.newFixedThreadPool(6)) {
            List<Callable<Void>> tasks=new ArrayList<>();
            for(int n=0;n<12;n++) {final String id="parallel-"+(n%6);tasks.add(()->{buy(id,"tteok");return null;});}
            for(var result:executor.invokeAll(tasks))result.get(20,TimeUnit.SECONDS);
        }
        assertThat(tteok().path("purchaseCount").asLong()).isEqualTo(6);
        assertThat(events.count()).isEqualTo(6);
    }
    @Test void missingUsersAndInvalidFoodsFailWithoutRecordingProgress() throws Exception {
        assertThatThrownBy(()->buy("bad-food","unknown")).hasMessageContaining("음식");
        tx.executeWithoutResult(s->users.deleteAll());
        assertThat(json(request("GET","/api/v1/users/me",null),404).path("error").path("code").asText()).isEqualTo("USER_NOT_FOUND");
        assertThat(events.count()).isZero();
    }
    @Test void zonesAndSwaggerExposeAllOperations() throws Exception {
        assertThat(get("/map/zones").path("zones").size()).isEqualTo(4);
        var api=json(request("GET","/v3/api-docs",null),200);
        assertThat(api.path("paths").size()).isEqualTo(21);
        json(request("GET","/api/v1/no-such-route",null),404);
        var ui=request("GET","/swagger-ui/index.html",null);
        assertThat(ui.statusCode()).isEqualTo(200);
        assertThat(ui.body()).contains("Swagger UI");
    }
    @Test void chargeAndResetEndpointsWorkProperly() throws Exception {
        var charged = json(request("POST","/api/v1/users/me/charge","{\"amount\":100000}"),200).path("data");
        assertThat(charged.path("balance").asLong()).isEqualTo(101000L);

        var reset = json(request("POST","/api/v1/demo/reset",null),200).path("data");
        assertThat(reset.path("balance").asLong()).isEqualTo(1000L);
        assertThat(reset.path("nickname").asText()).isEqualTo("승우");
    }
    @Test void gainExpAndLevelUpWorkProperly() throws Exception {
        var step1 = json(request("POST","/api/v1/users/me/exp","{\"exp\":50}"),200).path("data");
        assertThat(step1.path("level").asInt()).isEqualTo(1);
        assertThat(step1.path("exp").asLong()).isEqualTo(50L);
        assertThat(step1.path("nextLevelExp").asLong()).isEqualTo(100L);

        var step2 = json(request("POST","/api/v1/users/me/exp","{\"exp\":60}"),200).path("data");
        assertThat(step2.path("level").asInt()).isEqualTo(2);
        assertThat(step2.path("exp").asLong()).isEqualTo(10L);
        assertThat(step2.path("nextLevelExp").asLong()).isEqualTo(200L);
    }
    @Test void favoritesToggleAndListWorkProperly() throws Exception {
        var favs0 = json(request("GET","/api/v1/users/me/favorites",null),200).path("data");
        assertThat(favs0.path("favorites").size()).isZero();

        var t1 = json(request("PATCH","/api/v1/users/me/favorites/seomun",null),200).path("data");
        assertThat(t1.path("storeId").asText()).isEqualTo("seomun");
        assertThat(t1.path("favorite").asBoolean()).isTrue();
        assertThat(t1.path("favorites").get(0).asText()).isEqualTo("seomun");

        var favs1 = json(request("GET","/api/v1/users/me/favorites",null),200).path("data");
        assertThat(favs1.path("favorites").size()).isEqualTo(1);
        assertThat(favs1.path("favorites").get(0).asText()).isEqualTo("seomun");

        var t2 = json(request("PATCH","/api/v1/users/me/favorites/seomun",null),200).path("data");
        assertThat(t2.path("favorite").asBoolean()).isFalse();
        assertThat(t2.path("favorites").size()).isZero();

        var err = json(request("PATCH","/api/v1/users/me/favorites/bad-store",null),404);
        assertThat(err.path("error").path("code").asText()).isEqualTo("STORE_NOT_FOUND");
    }
}
