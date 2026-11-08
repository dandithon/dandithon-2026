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
class Be2IntegrationTest {
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
    @Test void etaPreviewIsSeparateFromInstantPriorityOrders()throws Exception {
        var quote=json(request("POST","/stores/seomun/eta","{\"items\":[{\"menuId\":\"fried\",\"quantity\":2}]}",null),200).path("data");
        assertThat(quote.path("appliedToOrders").asBoolean()).isFalse();
        assertThat(quote.path("synthetic").asBoolean()).isTrue();
        assertThat(buy("legacy-eta-disabled").path("readyAfterSeconds").asInt()).isZero();
    }
    @Test void catalogMatchesProfileAndUsesExplicitMockCrowding()throws Exception {
        var list=get("/stores").path("stores");assertThat(list.size()).isEqualTo(4);
        assertThat(list.get(0).path("crowdLevel").asText()).isEqualTo("NORMAL");
        assertThat(list.get(0).path("mock").asBoolean()).isTrue();
        assertThat(MarketService.crowd(0)).isEqualTo("CALM");assertThat(MarketService.crowd(4)).isEqualTo("CALM");
        assertThat(MarketService.crowd(5)).isEqualTo("NORMAL");assertThat(MarketService.crowd(9)).isEqualTo("NORMAL");
        assertThat(MarketService.crowd(10)).isEqualTo("CROWDED");assertThat(MarketService.crowd(19)).isEqualTo("CROWDED");assertThat(MarketService.crowd(20)).isEqualTo("VERY_CROWDED");
        var menus=catalog.stores().stream().flatMap(s->s.menus().stream()).toList();
        assertThat(menus.stream().map(m->m.id()+":"+m.name())).containsExactlyInAnyOrderElementsOf(ProfileCatalog.FOODS.stream().map(f->f.id()+":"+f.name()).toList());
        var seomun=get("/stores/seomun");
        assertThat(seomun.path("reviewCount").asInt()).isZero();
        assertThat(seomun.path("location").asText()).isEqualTo("서문시장 2지구 101호");
        assertThat(seomun.path("businessHours").asText()).contains("09:00 ~ 19:00");
        assertThat(seomun.path("phone").asText()).isEqualTo("053-256-1011");
        for(String storeId:List.of("seomun","noodle","hotteok","coffee")) {
            assertThat(get("/stores/"+storeId).path("location").asText()).contains("2지구");
            assertThat(get("/stores/"+storeId).path("businessHours").asText()).isNotEmpty();
        }
        json(request("GET","/stores/missing",null,null),404);
        json(request("GET","/stores/missing/reviews",null,null),404);
    }
    @Test void successfulPurchaseUpdatesBalanceProgressAndAllReceiptsAtomically()throws Exception {
        String multi="{\"storeId\":\"seomun\",\"items\":[{\"menuId\":\"tteok\",\"quantity\":2},{\"menuId\":\"sundae\",\"quantity\":1}]}";
        var order=json(request("POST","/orders",multi,"multi"),200).path("data");
        assertThat(order.path("totalPrice").asLong()).isEqualTo(900);assertThat(balance()).isEqualTo(100);
        assertThat(count("purchase_events")).isEqualTo(2);
        assertThat(jdbc.queryForObject("select purchase_count from food_progress where food_id='tteok'",Long.class)).isEqualTo(1);
        var receipts=get("/orders/receipts").path("receipts");assertThat(receipts.size()).isEqualTo(2);
        assertThat(receipts.get(0).path("status").asText()).isEqualTo("ready");
        assertThat(get("/profile/equipments").path("equipments").get(0).path("unlocked").asBoolean()).isTrue();
        assertThat(get("/orders/receipts").path("receipts").get(0).path("canReview").asBoolean()).isTrue();
        json(request("POST","/reviews",review(order.path("orderId").asText()),null),201);
        for(var receipt:get("/orders/receipts").path("receipts"))assertThat(receipt.path("status").asText()).isEqualTo("reviewed");
        assertThat(count("game_reviews")).isEqualTo(1);
    }
    @Test void rejectsInvalidOrdersWithoutAnyPartialWrites()throws Exception {
        json(request("POST","/orders",payload,null),400);
        for(String bad:List.of("null","{}",payload.replace("seomun","missing"),payload.replace("tteok","noodle-basic"),payload.replace(":1}",":0}"),payload.replace(":1}",":1.5}"),payload.replace("items\":[","items\":[null,"))) {
            var r=request("POST","/orders",bad,"invalid");assertThat(r.statusCode()).as(r.body()).isIn(400,404);
        }
        assertThat(balance()).isEqualTo(1000);assertThat(count("game_orders")).isZero();assertThat(count("purchase_events")).isZero();
        buy("one");buy("two");buy("three");
        assertThat(json(request("POST","/orders",payload,"four"),400).path("error").path("code").asText()).isEqualTo("INSUFFICIENT_BALANCE");
        assertThat(balance()).isEqualTo(100);assertThat(count("game_orders")).isEqualTo(3);assertThat(count("purchase_events")).isEqualTo(3);
    }
    @Test void failingOuterTransactionRollsBackBalanceOrderAndProgressTogether() {
        var tx=new org.springframework.transaction.support.TransactionTemplate(transactionManager);
        assertThatThrownBy(()->tx.executeWithoutResult(status->{
            service.order(new MarketService.OrderRequest("seomun",List.of(new MarketService.ItemRequest("tteok",1))),"rollback");
            throw new IllegalStateException("simulated failure after order and progress writes");
        })).isInstanceOf(IllegalStateException.class);
        assertThat(balance()).isEqualTo(1000);assertThat(count("game_orders")).isZero();
        assertThat(count("purchase_events")).isZero();assertThat(count("food_progress")).isZero();
    }
    @Test void repeatedAndConcurrentRequestsOnlyChargeOnce()throws Exception {
        String id=buy("retry").path("orderId").asText();
        try(var executor=Executors.newFixedThreadPool(6)) {
            List<Callable<String>> tasks=new ArrayList<>();for(int i=0;i<12;i++)tasks.add(()->buy("retry").path("orderId").asText());
            for(var future:executor.invokeAll(tasks))assertThat(future.get()).isEqualTo(id);
        }
        assertThat(balance()).isEqualTo(700);assertThat(count("game_orders")).isEqualTo(1);assertThat(count("purchase_events")).isEqualTo(1);
        json(request("POST","/orders",payload.replace("tteok","fish"),"retry"),400);
    }
    @Test void simultaneousDifferentOrdersCannotOverspend()throws Exception {
        try(var executor=Executors.newFixedThreadPool(6)) {
            List<Callable<Integer>> tasks=new ArrayList<>();for(int i=0;i<8;i++){String key="separate"+i;tasks.add(()->request("POST","/orders",payload,key).statusCode());}
            int successes=0;for(var f:executor.invokeAll(tasks)){int status=f.get();assertThat(status).isIn(200,400);if(status==200)successes++;}assertThat(successes).isEqualTo(3);
        }
        assertThat(balance()).isEqualTo(100);assertThat(count("purchase_events")).isEqualTo(3);
    }
    @Test void reviewIsImmediateWithValidInputAndCannotBeDuplicated()throws Exception {
        String id=buy("review").path("orderId").asText();
        assertThat(get("/orders/receipts").path("receipts").get(0).path("canReview").asBoolean()).isTrue();
        for(String bad:List.of(review(id).replace(":5",":0"),review(id).replace(" 맛있어요 "," "),review(id).replace("/assets/review.png","javascript:alert(1)")))json(request("POST","/reviews",bad,null),400);
        assertThat(count("game_reviews")).isZero();
        json(request("POST","/reviews",review(id),null),201);json(request("POST","/reviews",review(id),null),400);
        var detail=get("/stores/seomun");assertThat(detail.path("rating").asDouble()).isEqualTo(5);assertThat(detail.path("reviewCount").asInt()).isEqualTo(1);
        var reviews=get("/stores/seomun/reviews").path("reviews");assertThat(reviews.get(0).path("text").asText()).isEqualTo("맛있어요");assertThat(reviews.get(0).path("photos").asBoolean()).isTrue();
        assertThat(get("/stores/noodle/reviews").path("reviews").size()).isZero();
        json(request("POST","/reviews",review("unknown"),null),404);
    }
    @Test void dailyRewardIsSingleAtomicPaymentAndResetsAtKoreanMidnight()throws Exception {
        for(String key:List.of("q1","q2")){String id=buy(key).path("orderId").asText();clock.advance(15);json(request("POST","/reviews",review(id),null),201);}
        assertThat(get("/quests").path("daily").get(1).path("status").asText()).isEqualTo("COMPLETED");
        try(var executor=Executors.newFixedThreadPool(4)){
            List<Callable<Integer>> tasks=new ArrayList<>();for(int i=0;i<8;i++)tasks.add(()->request("POST","/quests/review-1/claim",null,null).statusCode());
            int successes=0;for(var f:executor.invokeAll(tasks)){int status=f.get();assertThat(status).isIn(200,400);if(status==200)successes++;}assertThat(successes).isEqualTo(1);
        }
        assertThat(balance()).isEqualTo(600);assertThat(count("quest_claims")).isEqualTo(1);
        assertThat(get("/quests").path("daily").get(1).path("status").asText()).isEqualTo("CLAIMED");
        clock.instant=Instant.parse("2026-11-03T15:00:00Z");
        assertThat(get("/quests").path("daily").get(1).path("current").asInt()).isZero();
        json(request("POST","/quests/review-1/claim",null,null),400);
        for(String key:List.of("next1","next2")){String id=buy(key).path("orderId").asText();clock.advance(15);json(request("POST","/reviews",review(id),null),201);}
        json(request("POST","/quests/review-1/claim",null,null),200);assertThat(balance()).isEqualTo(200);assertThat(count("quest_claims")).isEqualTo(2);
    }
    @Test void unverifiedVisitsAndPhotosNeverGrantRewards()throws Exception {
        for(String id:List.of("visit-3","photo-1"))json(request("POST","/quests/"+id+"/claim",null,null),400);
        json(request("POST","/quests/unknown/claim",null,null),400);
        assertThat(balance()).isEqualTo(1000);assertThat(count("quest_claims")).isZero();
    }
    @Test void reviewCanBeDeletedAndRestoresOrderStatus()throws Exception {
        String id=buy("delete-test").path("orderId").asText();
        clock.advance(15);
        var created = json(request("POST","/reviews",review(id),null),201).path("data");
        String reviewId = created.path("reviewId").asText();
        assertThat(count("game_reviews")).isEqualTo(1);

        var receipts1 = get("/orders/receipts").path("receipts");
        var ord1 = receipts1.get(0);
        assertThat(ord1.path("status").asText()).isEqualTo("reviewed");

        var del = json(request("DELETE","/reviews/"+reviewId,null,null),200).path("data");
        assertThat(del.path("deleted").asBoolean()).isTrue();
        assertThat(del.path("reviewId").asText()).isEqualTo(reviewId);
        assertThat(count("game_reviews")).isZero();

        var receipts2 = get("/orders/receipts").path("receipts");
        var ord2 = receipts2.get(0);
        assertThat(ord2.path("status").asText()).isEqualTo("ready");

        json(request("POST","/reviews",review(id),null),201);
        assertThat(count("game_reviews")).isEqualTo(1);

        var err = json(request("DELETE","/reviews/non-existent-review",null,null),404);
        assertThat(err.path("error").path("code").asText()).isEqualTo("REVIEW_NOT_FOUND");
    }
}
