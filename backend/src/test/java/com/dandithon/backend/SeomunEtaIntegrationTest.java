package com.dandithon.backend;

import com.dandithon.backend.market.*;
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
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.*;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties={"eta.enabled=true","eta.seconds-per-minute=60"})
@ActiveProfiles("test")
class SeomunEtaIntegrationTest {
    static class TestClock extends Clock {
        volatile Instant instant=Instant.parse("2026-11-05T03:00:00Z");
        public ZoneId getZone(){return ZoneId.of("Asia/Seoul");}
        public Clock withZone(ZoneId zone){return Clock.fixed(instant,zone);}
        public Instant instant(){return instant;}
        void advance(long seconds){instant=instant.plusSeconds(seconds);}
    }
    @TestConfiguration static class Config {@Bean @Primary TestClock testClock(){return new TestClock();}}
    @Autowired TestClock clock;
    @Autowired JdbcTemplate jdbc;
    @Autowired SeomunEtaModel model;
    @Autowired MarketService market;
    @Autowired SeomunEtaService eta;
    @Autowired org.springframework.transaction.PlatformTransactionManager manager;
    @LocalServerPort int port;
    final HttpClient client=HttpClient.newHttpClient();
    final ObjectMapper mapper=new ObjectMapper();
    @BeforeEach void reset(){
        clock.instant=Instant.parse("2026-11-05T03:00:00Z");
        for(String table:List.of("seomun_demo_queue","daily_activities","review_images","game_reviews","order_lines","game_orders","quest_claims","purchase_events","food_progress","equipped_items"))jdbc.update("delete from "+table);
        jdbc.update("update app_users set balance=100000,nickname='승우' where id=1");
    }
    HttpResponse<String> request(String method,String path,String body,String key)throws Exception {
        var b=HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+"/api/v1"+path)).header("Content-Type","application/json");
        if(key!=null)b.header("Idempotency-Key",key);
        return client.send(b.method(method,body==null?HttpRequest.BodyPublishers.noBody():HttpRequest.BodyPublishers.ofString(body)).build(),HttpResponse.BodyHandlers.ofString());
    }
    JsonNode data(String method,String path,String body,String key,int status)throws Exception {
        var r=request(method,path,body,key);assertThat(r.statusCode()).as(r.body()).isEqualTo(status);return mapper.readTree(r.body()).path("data");
    }
    JsonNode queue()throws Exception{return data("GET","/stores/seomun/eta",null,null,200);}
    String items="{\"items\":[{\"menuId\":\"tteok\",\"quantity\":1}]}";
    String order="{\"storeId\":\"seomun\",\"items\":[{\"menuId\":\"tteok\",\"quantity\":1}]}";
    JsonNode buy(String key)throws Exception{return data("POST","/orders",order,key,200);}
    @Test void exportedForestMatchesPythonPredictions()throws Exception {
        try(var in=new ClassPathResource("eta/parity-vectors.json").getInputStream()) {
            var vectors=mapper.readTree(in);
            for(var v:vectors){Map<String,Integer> quantities=new HashMap<>();for(String id:List.of("tteok","sundae","fried","fish"))quantities.put(id,v.path("quantities").path(id).asInt());
                assertThat(model.predict(quantities)).isCloseTo(v.path("expectedMinutes").asDouble(),within(1e-9));}
        }
        assertThat(model.predict(Map.of("fried",99))).isGreaterThan(model.predict(Map.of("fried",1)));
    }
    @Test void previewValidatesMenuAndNeverCreatesOrdersOrChargesCoins()throws Exception {
        var quote=data("POST","/stores/seomun/eta",items,null,200);
        assertThat(quote.path("synthetic").asBoolean()).isTrue();
        assertThat(quote.path("source").asText()).isEqualTo("SYNTHETIC_DEMO_QUEUE");
        assertThat(quote.path("appliedToOrders").asBoolean()).isFalse();
        assertThat(quote.path("preparationMinutes").asDouble()).isPositive();
        for(String bad:List.of("{}","null","{\"items\":[]}","{\"items\":[{\"menuId\":\"tteok\",\"quantity\":0}]}",
            "{\"items\":[{\"menuId\":\"tteok\",\"quantity\":100}]}","{\"items\":[{\"menuId\":\"tteok\",\"quantity\":1.5}]}",
            "{\"items\":[{\"menuId\":\"tteok\",\"quantity\":1},{\"menuId\":\"tteok\",\"quantity\":1}]}"))data("POST","/stores/seomun/eta",bad,null,400);
        data("GET","/stores/noodle/eta",null,null,400);data("GET","/stores/missing/eta",null,null,404);
        assertThat(jdbc.queryForObject("select count(*) from game_orders",Long.class)).isZero();
        assertThat(jdbc.queryForObject("select balance from app_users where id=1",Long.class)).isEqualTo(100000);
    }
    JsonNode seed()throws Exception{return data("POST","/demo/seomun/queue/seed",null,null,200);}
    @Test void sevenFictionalOrdersShowSevenNpcsWithoutTouchingGuestData()throws Exception {
        var q=seed();assertThat(q.path("activeOrders").asInt()).isEqualTo(7);
        assertThat(q.path("npcCount").asInt()).isEqualTo(7);
        assertThat(q.path("waitTimeMinutes").asDouble()).isBetween(18.01,21.0);
        assertThat(q.path("secondsPerSimulatedMinute").asInt()).isEqualTo(60);
        var summary=data("GET","/stores",null,null,200).path("stores").get(0);
        assertThat(summary.path("npcCount").asInt()).isEqualTo(7);
        assertThat(summary.path("waitTimeSource").asText()).isEqualTo("SYNTHETIC_DEMO_QUEUE");
        for(String table:List.of("game_orders","game_reviews","purchase_events","food_progress","quest_claims","daily_activities"))assertThat(jdbc.queryForObject("select count(*) from "+table,Long.class)).as(table).isZero();
        assertThat(jdbc.queryForObject("select balance from app_users where id=1",Long.class)).isEqualTo(100000);
        seed();assertThat(jdbc.queryForObject("select count(*) from seomun_demo_queue",Long.class)).isEqualTo(7);
        clock.advance(180);assertThat(queue().path("npcCount").asInt()).isLessThan(7);
        clock.advance(3600);assertThat(queue().path("activeOrders").asInt()).isZero();assertThat(queue().path("npcCount").asInt()).isZero();
    }
    @Test void priorityUserOrdersAreImmediatelyReadyAndNeverChangeGeneralQueue()throws Exception {
        var before=seed();var first=buy("one");
        assertThat(first.path("status").asText()).isEqualTo("ready");assertThat(first.path("readyAfterSeconds").asInt()).isZero();
        assertThat(buy("one").path("orderId").asText()).isEqualTo(first.path("orderId").asText());
        assertThat(queue()).isEqualTo(before);
        var rows=data("GET","/orders/receipts",null,null,200).path("receipts");assertThat(rows.get(0).path("canReview").asBoolean()).isTrue();
        String review=mapper.writeValueAsString(Map.of("orderId",first.path("orderId").asText(),"rating",5,"text","즉시 리뷰"));
        var saved=data("POST","/reviews",review,null,201);data("POST","/reviews",review,null,400);
        assertThat(queue()).isEqualTo(before);
        data("DELETE","/reviews/"+saved.path("reviewId").asText(),null,null,200);data("POST","/reviews",review,null,201);
        assertThat(queue()).isEqualTo(before);
        var other=data("POST","/orders","{\"storeId\":\"hotteok\",\"items\":[{\"menuId\":\"hotteok-rice\",\"quantity\":1}]}","other",200);
        assertThat(other.path("status").asText()).isEqualTo("ready");assertThat(other.path("readyAfterSeconds").asInt()).isZero();
    }
    @Test void repeatedConcurrentSeedAndUserRequestsNeverDuplicateQueuesOrPurchases()throws Exception {
        try(var pool=Executors.newFixedThreadPool(4)) {
            List<Callable<Void>> tasks=new ArrayList<>();for(int i=0;i<6;i++)tasks.add(()->{seed();return null;});
            for(var f:pool.invokeAll(tasks))f.get(30,TimeUnit.SECONDS);
            tasks.clear();for(int i=0;i<6;i++)tasks.add(()->{buy("same");return null;});
            for(var f:pool.invokeAll(tasks))f.get(30,TimeUnit.SECONDS);
        }
        assertThat(queue().path("activeOrders").asInt()).isEqualTo(7);
        assertThat(jdbc.queryForObject("select count(*) from game_orders",Long.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("select balance from app_users where id=1",Long.class)).isEqualTo(99700);
        jdbc.update("update app_users set balance=0 where id=1");data("POST","/orders",order,"no-money",400);
        assertThat(queue().path("activeOrders").asInt()).isEqualTo(7);
    }
    @Test void seedRollsBackAndClearOrFullResetRemoveOnlyIntendedData()throws Exception {
        var before=seed();
        assertThatThrownBy(()->new TransactionTemplate(manager).executeWithoutResult(tx->{eta.seed();throw new IllegalStateException("rollback");})).isInstanceOf(IllegalStateException.class);
        assertThat(queue()).isEqualTo(before);
        buy("keep");data("DELETE","/demo/seomun/queue",null,null,200);
        assertThat(queue().path("activeOrders").asInt()).isZero();assertThat(jdbc.queryForObject("select count(*) from game_orders",Long.class)).isEqualTo(1);
        seed();data("POST","/demo/reset",null,null,200);
        assertThat(queue().path("activeOrders").asInt()).isEqualTo(7);assertThat(jdbc.queryForObject("select count(*) from game_orders",Long.class)).isZero();
    }
    @Test void npcBoundariesAreExplicit() {
        assertThat(SeomunEtaService.npcCount(0)).isZero();assertThat(SeomunEtaService.npcCount(3)).isEqualTo(1);
        assertThat(SeomunEtaService.npcCount(3.01)).isEqualTo(2);assertThat(SeomunEtaService.npcCount(300)).isEqualTo(10);
    }
}
