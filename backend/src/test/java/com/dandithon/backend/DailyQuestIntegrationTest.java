package com.dandithon.backend;

import com.dandithon.backend.market.*;
import com.dandithon.backend.profile.ProfileCatalog;
import java.net.URI;
import java.net.http.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import tools.jackson.databind.*;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class DailyQuestIntegrationTest {
    static class TestClock extends Clock {
        volatile Instant instant=Instant.parse("2026-11-03T03:00:00Z");
        public ZoneId getZone(){return ZoneId.of("Asia/Seoul");}
        public Clock withZone(ZoneId zone){return Clock.fixed(instant,zone);}
        public Instant instant(){return instant;}
        void advance(long seconds){instant=instant.plusSeconds(seconds);}
    }
    @TestConfiguration static class Config {@Bean @Primary TestClock testClock(){return new TestClock();}}
    @Autowired TestClock clock;
    @Autowired JdbcTemplate jdbc;
    @Autowired MarketCatalog catalog;
    @Autowired MarketService service;
    @Autowired com.dandithon.backend.profile.ProfileService profile;
    @Autowired org.springframework.transaction.PlatformTransactionManager transactionManager;
    @LocalServerPort int port;
    final ObjectMapper mapper=new ObjectMapper();
    final HttpClient client=HttpClient.newHttpClient();
    @BeforeEach void reset(){
        clock.instant=Instant.parse("2026-11-03T03:00:00Z");
        for(String table:List.of("daily_activities","review_images","game_reviews","order_lines","game_orders","quest_claims","purchase_events","food_progress","equipped_items"))jdbc.update("delete from "+table);
        jdbc.update("update app_users set balance=1000,nickname='승우' where id=1");
    }
    HttpResponse<String> request(String method,String path,String body,String key)throws Exception {
        var b=HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+"/api/v1"+path)).header("Content-Type","application/json");
        if(key!=null)b.header("Idempotency-Key",key);
        return client.send(b.method(method,body==null?HttpRequest.BodyPublishers.noBody():HttpRequest.BodyPublishers.ofString(body)).build(),HttpResponse.BodyHandlers.ofString());
    }
    JsonNode json(HttpResponse<String> r,int status){assertThat(r.statusCode()).as(r.body()).isEqualTo(status);return mapper.readTree(r.body());}
    JsonNode get(String path)throws Exception{return json(request("GET",path,null,null),200).path("data");}
    String payload="{\"storeId\":\"seomun\",\"items\":[{\"menuId\":\"tteok\",\"quantity\":1}]}";
    JsonNode buy(String key)throws Exception{return json(request("POST","/orders",payload,key),200).path("data");}
    String review(String order){return mapper.writeValueAsString(Map.of("orderId",order,"rating",5,"text"," 맛있어요 ","imageUrls",List.of("/assets/review.png")));}
    long balance(){return jdbc.queryForObject("select balance from app_users where id=1",Long.class);}
    long count(String table){return jdbc.queryForObject("select count(*) from "+table,Long.class);}
    JsonNode quest(int index)throws Exception{return get("/quests").path("daily").get(index);}
    void browse(String store)throws Exception{json(request("POST","/stores/"+store+"/browse",null,null),200);}
    void equipHat()throws Exception{json(request("PATCH","/profile/equipments/tteok-hat/toggle",null,null),200);}

    @Test void browsingCountsDistinctStoresAndPaysOnlyOncePerDay()throws Exception {
        assertThat(quest(0).path("title").asText()).isEqualTo("가게 3곳 둘러보기");
        json(request("POST","/stores/unknown/browse",null,null),404);
        json(request("POST","/quests/visit-3/claim",null,null),400);
        try(var executor=Executors.newFixedThreadPool(4)){
            List<Callable<Void>> tasks=new ArrayList<>();for(int i=0;i<12;i++)tasks.add(()->{browse("seomun");return null;});
            for(var f:executor.invokeAll(tasks))f.get();
        }
        assertThat(quest(0).path("current").asInt()).isEqualTo(1);
        // Reading details alone never writes activity.
        get("/stores/noodle");assertThat(quest(0).path("current").asInt()).isEqualTo(1);
        browse("noodle");browse("hotteok");browse("coffee");
        assertThat(quest(0).path("current").asInt()).isEqualTo(3);
        assertThat(quest(0).path("status").asText()).isEqualTo("COMPLETED");
        try(var executor=Executors.newFixedThreadPool(4)){
            List<Callable<Integer>> tasks=new ArrayList<>();for(int i=0;i<8;i++)tasks.add(()->request("POST","/quests/visit-3/claim",null,null).statusCode());
            int success=0;for(var f:executor.invokeAll(tasks)){int status=f.get();assertThat(status).isIn(200,400);if(status==200)success++;}assertThat(success).isEqualTo(1);
        }
        assertThat(balance()).isEqualTo(1300);
        clock.instant=Instant.parse("2026-11-03T15:00:00Z");
        assertThat(quest(0).path("current").asInt()).isZero();
        browse("seomun");browse("noodle");browse("hotteok");
        json(request("POST","/quests/visit-3/claim",null,null),200);assertThat(balance()).isEqualTo(1600);
    }
    @Test void oneSeomunReviewCompletesDailyMissionAndOtherStoresDoNot()throws Exception {
        var other=json(request("POST","/orders",mapper.writeValueAsString(Map.of("storeId","hotteok","items",List.of(Map.of("menuId","hotteok-rice","quantity",1)))),"other"),200).path("data");
        clock.advance(15);json(request("POST","/reviews",review(other.path("orderId").asText()),null),201);
        assertThat(quest(1).path("current").asInt()).isZero();
        String id=buy("one-review").path("orderId").asText();clock.advance(15);
        json(request("POST","/reviews",review(id),null),201);
        assertThat(quest(1).path("target").asInt()).isEqualTo(1);
        assertThat(quest(1).path("status").asText()).isEqualTo("COMPLETED");
        json(request("POST","/quests/review-1/claim",null,null),200);assertThat(balance()).isEqualTo(800);
        json(request("POST","/quests/review-1/claim",null,null),400);
    }
    @Test void successfulHatWearPersistsAfterUnequipAndRequiresNewActionNextDay()throws Exception {
        assertThat(quest(2).path("id").asText()).isEqualTo("equip-hat");
        json(request("PATCH","/profile/equipments/tteok-hat/toggle",null,null),400);
        assertThat(quest(2).path("current").asInt()).isZero();
        buy("unlock-hat");assertThat(quest(2).path("current").asInt()).isZero();
        equipHat();equipHat(); // Wearing counts, removing does not revoke completion.
        assertThat(quest(2).path("status").asText()).isEqualTo("COMPLETED");
        json(request("POST","/quests/equip-hat/claim",null,null),200);
        json(request("POST","/quests/equip-hat/claim",null,null),400);assertThat(balance()).isEqualTo(800);
        equipHat();
        clock.instant=Instant.parse("2026-11-03T15:00:00Z");
        assertThat(quest(2).path("current").asInt()).isZero();
        equipHat();assertThat(quest(2).path("current").asInt()).isZero();
        equipHat();json(request("POST","/quests/equip-hat/claim",null,null),200);assertThat(balance()).isEqualTo(900);
        json(request("POST","/quests/photo-1/claim",null,null),400);
    }
    @Test void activityRollsBackWithFailedWearAndReviewClaimHistoryIsPreserved()throws Exception {
        buy("unlock");
        var tx=new org.springframework.transaction.support.TransactionTemplate(transactionManager);
        assertThatThrownBy(()->tx.executeWithoutResult(status->{profile.toggle("tteok-hat");throw new IllegalStateException("rollback");})).isInstanceOf(IllegalStateException.class);
        assertThat(quest(2).path("current").asInt()).isZero();
        assertThat(get("/users/me").path("equipped").path("head").isNull()).isTrue();
        jdbc.update("insert into quest_claims(id,user_id) values('1:review-1:2026-11-03',1)");
        assertThat(quest(1).path("status").asText()).isEqualTo("CLAIMED");
        json(request("POST","/quests/review-1/claim",null,null),400);
    }
}
