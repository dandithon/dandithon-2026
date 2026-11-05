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
    properties={"eta.enabled=true","eta.seconds-per-minute=5"})
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
    @Autowired org.springframework.transaction.PlatformTransactionManager manager;
    @LocalServerPort int port;
    final HttpClient client=HttpClient.newHttpClient();
    final ObjectMapper mapper=new ObjectMapper();
    @BeforeEach void reset(){
        clock.instant=Instant.parse("2026-11-05T03:00:00Z");
        for(String table:List.of("daily_activities","review_images","game_reviews","order_lines","game_orders","quest_claims","purchase_events","food_progress","equipped_items"))jdbc.update("delete from "+table);
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
        assertThat(quote.path("source").asText()).isEqualTo("SYNTHETIC_MODEL");
        assertThat(quote.path("preparationMinutes").asDouble()).isPositive();
        assertThat(quote.path("queueWaitMinutes").asDouble()).isZero();
        for(String bad:List.of("{}","null","{\"items\":[]}","{\"items\":[{\"menuId\":\"tteok\",\"quantity\":0}]}",
            "{\"items\":[{\"menuId\":\"tteok\",\"quantity\":100}]}","{\"items\":[{\"menuId\":\"tteok\",\"quantity\":1.5}]}",
            "{\"items\":[{\"menuId\":\"tteok\",\"quantity\":1},{\"menuId\":\"tteok\",\"quantity\":1}]}"))
            data("POST","/stores/seomun/eta",bad,null,400);
        data("POST","/stores/seomun/eta","{\"items\":[{\"menuId\":\"coffee-latte\",\"quantity\":1}]}",null,404);
        data("GET","/stores/noodle/eta",null,null,400);data("GET","/stores/missing/eta",null,null,404);
        assertThat(jdbc.queryForObject("select count(*) from game_orders",Long.class)).isZero();
        assertThat(jdbc.queryForObject("select balance from app_users where id=1",Long.class)).isEqualTo(100000);
    }
    @Test void ordersQueueReplayAndCompleteAtPersistedReadyTime()throws Exception {
        assertThat(queue().path("npcCount").asInt()).isZero();
        var preview=data("POST","/stores/seomun/eta",items,null,200);
        var first=buy("one");int seconds=first.path("readyAfterSeconds").asInt();
        assertThat(seconds).isEqualTo(preview.path("readyAfterSeconds").asInt());
        assertThat(queue().path("activeOrders").asInt()).isEqualTo(1);
        assertThat(buy("one").path("orderId").asText()).isEqualTo(first.path("orderId").asText());
        assertThat(queue().path("activeOrders").asInt()).isEqualTo(1);
        var second=buy("two");assertThat(second.path("readyAfterSeconds").asInt()).isEqualTo(seconds*2);
        var summary=data("GET","/stores",null,null,200).path("stores").get(0);
        assertThat(summary.path("waitTimeSource").asText()).isEqualTo("SYNTHETIC_MODEL");
        assertThat(summary.path("npcCount").asInt()).isEqualTo(SeomunEtaService.npcCount(seconds*2/5.0));
        String review=mapper.writeValueAsString(Map.of("orderId",first.path("orderId").asText(),"rating",5,"text","시연 리뷰"));
        var saved=data("POST","/reviews",review,null,201);
        assertThat(queue().path("activeOrders").asInt()).isEqualTo(2);
        data("POST","/reviews",review,null,400);
        var rows=data("GET","/orders/receipts",null,null,200).path("receipts");
        for(var row:rows)if(row.path("orderId").asText().equals(first.path("orderId").asText()))assertThat(row.path("canReview").asBoolean()).isFalse();
        data("DELETE","/reviews/"+saved.path("reviewId").asText(),null,null,200);
        rows=data("GET","/orders/receipts",null,null,200).path("receipts");
        for(var row:rows)if(row.path("orderId").asText().equals(first.path("orderId").asText()))assertThat(row.path("canReview").asBoolean()).isTrue();
        data("POST","/reviews",review,null,201);
        clock.advance(seconds);assertThat(queue().path("activeOrders").asInt()).isEqualTo(1);
        data("POST","/reviews",review,null,400);
        clock.advance(seconds);assertThat(queue().path("activeOrders").asInt()).isZero();
        assertThat(queue().path("npcCount").asInt()).isZero();
        // Persisted deadlines are authoritative, independent of a new model invocation.
        assertThat(jdbc.queryForObject("select eta_model_version from game_orders where id=?",String.class,first.path("orderId").asText())).isEqualTo(model.version());
    }
    @Test void concurrentOrdersSerializeButFailedAndRolledBackOrdersDoNotLeaveQueue()throws Exception {
        try(var pool=Executors.newFixedThreadPool(4)) {
            List<Callable<JsonNode>> tasks=new ArrayList<>();for(int i=0;i<6;i++) {String key="parallel-"+(i%3);tasks.add(()->buy(key));}
            for(var f:pool.invokeAll(tasks))f.get(30,TimeUnit.SECONDS);
        }
        assertThat(queue().path("activeOrders").asInt()).isEqualTo(3);
        var deadlines=jdbc.queryForList("select ready_at from game_orders order by ready_at");
        assertThat(deadlines).hasSize(3);assertThat(new HashSet<>(deadlines)).hasSize(3);
        jdbc.update("update app_users set balance=0 where id=1");
        data("POST","/orders",order,"no-money",400);
        assertThat(queue().path("activeOrders").asInt()).isEqualTo(3);
        jdbc.update("update app_users set balance=100000 where id=1");
        assertThatThrownBy(()->new TransactionTemplate(manager).executeWithoutResult(tx->{market.order(new MarketService.OrderRequest("seomun",List.of(new MarketService.ItemRequest("tteok",1))),"rollback");throw new IllegalStateException("rollback");})).isInstanceOf(IllegalStateException.class);
        assertThat(queue().path("activeOrders").asInt()).isEqualTo(3);
        data("POST","/demo/reset",null,null,200);
        assertThat(queue().path("activeOrders").asInt()).isZero();
        assertThat(queue().path("waitTimeMinutes").asDouble()).isZero();
    }
    @Test void otherStoresKeepFifteenSecondBehaviorAndNpcBoundariesAreExplicit()throws Exception {
        var other=data("POST","/orders","{\"storeId\":\"hotteok\",\"items\":[{\"menuId\":\"hotteok-rice\",\"quantity\":1}]}","other",200);
        assertThat(other.path("readyAfterSeconds").asInt()).isEqualTo(15);
        assertThat(queue().path("activeOrders").asInt()).isZero();
        assertThat(SeomunEtaService.npcCount(0)).isZero();assertThat(SeomunEtaService.npcCount(3)).isEqualTo(1);
        assertThat(SeomunEtaService.npcCount(3.01)).isEqualTo(2);assertThat(SeomunEtaService.npcCount(300)).isEqualTo(10);
    }
}
