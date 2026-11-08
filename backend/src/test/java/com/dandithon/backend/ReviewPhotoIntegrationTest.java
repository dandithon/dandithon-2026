package com.dandithon.backend;
import com.dandithon.backend.market.*;
import com.dandithon.backend.profile.ProfileService;
import java.awt.image.BufferedImage;
import java.io.*;
import java.net.URI;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import tools.jackson.databind.*;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test") @Import(Be2IntegrationTest.Config.class)
class ReviewPhotoIntegrationTest {
    @Autowired MarketService market;
    @Autowired ProfileService profile;
    @Autowired SeomunEtaService eta;
    @Autowired ReviewPhotoRepository photos;
    @Autowired Be2IntegrationTest.TestClock clock;
    @LocalServerPort int port;
    final HttpClient client=HttpClient.newHttpClient();
    final ObjectMapper mapper=new ObjectMapper();
    @BeforeEach void reset(){clock.instant=Instant.parse("2026-11-03T03:00:00Z");profile.resetDemo();}
    String order(String key){var result=market.order(new MarketService.OrderRequest("seomun",List.of(new MarketService.ItemRequest("tteok",1))),key);clock.advance(16);return result.orderId();}
    byte[] png()throws Exception{var output=new ByteArrayOutputStream();ImageIO.write(new BufferedImage(40,30,BufferedImage.TYPE_INT_ARGB),"png",output);return output.toByteArray();}
    HttpResponse<byte[]> upload(String orderId,byte[] bytes)throws Exception{return upload(orderId,bytes,1);}
    HttpResponse<byte[]> upload(String orderId,byte[] bytes,long guest)throws Exception{
        String boundary="PhotoTestBoundary";var body=new ByteArrayOutputStream();
        body.write(("--"+boundary+"\r\nContent-Disposition: form-data; name=\"orderId\"\r\n\r\n"+orderId+"\r\n--"+boundary+"\r\nContent-Disposition: form-data; name=\"file\"; filename=\"../../image.png\"\r\nContent-Type: image/png\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        body.write(bytes);body.write(("\r\n--"+boundary+"--\r\n").getBytes(StandardCharsets.UTF_8));
        return client.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+"/api/v1/review-photos")).header("X-User-Id",Long.toString(guest)).header("Content-Type","multipart/form-data; boundary="+boundary).POST(HttpRequest.BodyPublishers.ofByteArray(body.toByteArray())).build(),HttpResponse.BodyHandlers.ofByteArray());
    }
    String url(HttpResponse<byte[]> response){assertThat(response.statusCode()).as(new String(response.body(),StandardCharsets.UTF_8)).isEqualTo(200);return mapper.readTree(response.body()).path("data").path("url").asText();}
    @Test void phonePhotoUploadsRendersAndSurvivesReviewReloadThenDeletesWithReview()throws Exception{
        String order=order("photo-order");String url=url(upload(order,png()));
        assertThat(url).matches("/api/v1/review-photos/[a-f0-9-]{36}");
        var image=client.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+url)).GET().build(),HttpResponse.BodyHandlers.ofByteArray());
        assertThat(image.statusCode()).isEqualTo(200);assertThat(image.headers().firstValue("Content-Type")).hasValue("image/jpeg");
        var decoded=ImageIO.read(new ByteArrayInputStream(image.body()));assertThat(decoded.getWidth()).isEqualTo(40);
        var review=market.review(new MarketService.ReviewRequest(order,5,"사진 첨부 후기",List.of(url)));
        assertThat(market.reviews("seomun").getFirst().imageUrls()).containsExactly(url);
        assertThat(market.reviews("seomun").getFirst().photos()).isTrue();
        market.deleteReview(review.reviewId());assertThat(photos.count()).isZero();
    }
    @Test void rejectsNonImagesAndUnknownOrdersButAcceptsImmediatePhotos()throws Exception{
        String order=order("invalid-photo");assertThat(upload(order,"<svg>bad</svg>".getBytes()).statusCode()).isEqualTo(400);
        assertThat(upload("unknown",png()).statusCode()).isEqualTo(400);
        var cooking=market.order(new MarketService.OrderRequest("seomun",List.of(new MarketService.ItemRequest("tteok",1))),"cooking");
        assertThat(upload(cooking.orderId(),png()).statusCode()).isEqualTo(200);assertThat(photos.count()).isEqualTo(1);
    }
    @Test void cannotAttachAnotherOrdersPhotoAndResetClearsStoredFiles()throws Exception{
        String first=order("first-photo"),url=url(upload(first,png())),second=order("second-photo");
        assertThatThrownBy(()->market.review(new MarketService.ReviewRequest(second,5,"다른 주문",List.of(url)))).hasMessageContaining("이 주문");
        assertThat(market.reviews("seomun")).isEmpty();assertThat(photos.count()).isEqualTo(1);
        profile.resetDemo();assertThat(photos.count()).isZero();
    }
    JsonNode guest(String method,String path,Object body,long id,int status)throws Exception {
        var b=HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+"/api/v1"+path)).header("X-User-Id",Long.toString(id)).header("Content-Type","application/json").header("Idempotency-Key","same-key");
        var response=client.send(b.method(method,body==null?HttpRequest.BodyPublishers.noBody():HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body))).build(),HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).as(response.body()).isEqualTo(status);return mapper.readTree(response.body()).path("data");
    }
    @Test void guestsKeepOwnInstantPhotoReviewsAndResetsNeverClearSharedAiQueue()throws Exception {
        eta.seed();
        var body=Map.of("storeId","seomun","items",List.of(Map.of("menuId","tteok","quantity",1)));
        var one=guest("POST","/orders",body,91,200);var two=guest("POST","/orders",body,92,200);
        assertThat(one.path("orderId").asText()).isNotEqualTo(two.path("orderId").asText());
        assertThat(one.path("status").asText()).isEqualTo("ready");assertThat(two.path("readyAfterSeconds").asInt()).isZero();
        String id=one.path("orderId").asText();
        assertThat(upload(id,png(),92).statusCode()).isEqualTo(400);
        String photo=url(upload(id,png(),91));
        var review=Map.of("orderId",id,"rating",5,"text","즉시 사진 리뷰","imageUrls",List.of(photo));
        guest("POST","/reviews",review,92,404);guest("POST","/reviews",review,91,201);
        guest("POST","/reviews",review,91,400);
        assertThat(guest("GET","/orders/receipts",null,92,200).path("receipts").size()).isEqualTo(1);
        guest("POST","/demo/reset",null,92,200);
        assertThat(photos.count()).isEqualTo(1);assertThat(eta.queue("seomun").activeOrders()).isEqualTo(7);
        assertThat(guest("GET","/orders/receipts",null,91,200).path("receipts").size()).isEqualTo(1);
        guest("POST","/demo/reset",null,91,200);
        assertThat(photos.count()).isZero();assertThat(eta.queue("seomun").activeOrders()).isEqualTo(7);
        eta.clear();
    }

}
