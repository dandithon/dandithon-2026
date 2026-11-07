package com.dandithon.backend.market;

import com.dandithon.backend.common.ApiException;
import com.dandithon.backend.profile.PurchaseProgressService;
import com.dandithon.backend.user.*;
import java.net.URI;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional(readOnly=true)
public class MarketService {
    private final MarketCatalog catalog;
    private final OrderRepository orders;
    private final ReviewRepository reviews;
    private final UserRepository users;
    private final PurchaseProgressService progress;
    private final Clock clock;
    private final ReviewPhotoService photos;
    public MarketService(MarketCatalog catalog,OrderRepository orders,ReviewRepository reviews,UserRepository users,PurchaseProgressService progress,Clock clock,ReviewPhotoService photos) {
        this.catalog=catalog;this.orders=orders;this.reviews=reviews;this.users=users;this.progress=progress;this.clock=clock;this.photos=photos;
    }
    public record ItemRequest(String menuId,Integer quantity) {}
    public record OrderRequest(String storeId,List<ItemRequest> items) {}
    public record ReviewRequest(String orderId,Integer rating,String text,List<String> imageUrls) {}
    public record OrderItem(String menuId,String menuName,int quantity,long price) {}
    public record OrderResult(String orderId,String storeId,long totalPrice,long remainingBalance,String status,int readyAfterSeconds,List<OrderItem> items) {}
    public record Receipt(String orderId,String storeId,String storeName,String menuId,String menuName,int quantity,String status,boolean canReview,LocalDateTime orderedAt) {}
    public record ReviewView(String id,String authorName,int rating,String text,String date,boolean photos,List<String> imageUrls) {}
    public record ReviewResult(String reviewId,String orderId,int rating,String text,String authorName,String date) {}
    public record StoreSummary(String id,String name,String category,int waitTimeMinutes,String crowdLevel,String crowdLabel,int npcCount,List<String> tags,boolean mock) {}
    public record StoreDetail(String id,String name,String category,String description,String greeting,String location,String businessHours,String phone,double rating,int reviewCount,List<String> tags,List<MarketCatalog.Menu> menus,boolean mock) {}
    public static String crowd(int minutes) {return minutes<5?"CALM":minutes<10?"NORMAL":minutes<20?"CROWDED":"VERY_CROWDED";}
    public List<StoreSummary> stores() {
        return catalog.stores().stream().map(s->{
            String level=crowd(s.waitTimeMinutes());
            String label=switch(level){case "CALM"->"여유";case "NORMAL"->"보통";case "CROWDED"->"혼잡";default->"매우 혼잡";};
            int npcs=switch(level){case "CALM"->2;case "NORMAL"->4;case "CROWDED"->7;default->10;};
            return new StoreSummary(s.id(),s.name(),s.category(),s.waitTimeMinutes(),level,label,npcs,s.tags(),true);
        }).toList();
    }
    public StoreDetail store(String id) {
        var s=catalog.store(id);var all=reviews.findByStoreIdOrderByCreatedAtDescIdDesc(id);
        double rating=all.stream().mapToInt(r->r.rating).average().orElse(0);
        return new StoreDetail(s.id(),s.name(),s.category(),s.description(),s.greeting(),s.location(),s.businessHours(),s.phone(),Math.round(rating*10)/10.0,all.size(),s.tags(),s.menus(),true);
    }
    @Transactional
    public OrderResult order(OrderRequest request,String key) {
        if(key==null||!key.matches("[A-Za-z0-9_-]{1,128}"))throw ApiException.invalid("Idempotency-Key 헤더에 주문별 고유 키(영문·숫자·_- 1~128자)를 보내 주세요.");
        if(request==null||request.storeId()==null||request.items()==null||request.items().isEmpty()||request.items().size()>16)throw ApiException.invalid("가게와 주문 메뉴를 확인해 주세요.");
        var store=catalog.store(request.storeId());
        var quantities=new TreeMap<String,Integer>();
        for(var item:request.items()) {
            if(item==null||item.menuId()==null||item.quantity()==null||item.quantity()<1||item.quantity()>99)throw ApiException.invalid("메뉴 수량은 1~99 정수여야 해요.");
            catalog.menu(store,item.menuId());
            if(quantities.putIfAbsent(item.menuId(),item.quantity())!=null)throw ApiException.invalid("같은 메뉴는 한 행에 수량을 합쳐 주세요.");
        }
        String signature=store.id()+":"+quantities;
        long currentUserId = com.dandithon.backend.user.UserContext.getUserId();
        var user=lockedUser();
        var prior=orders.findByUserIdAndRequestKey(currentUserId,key);
        if(prior.isPresent()) {
            if(!prior.get().requestSignature.equals(signature))throw ApiException.invalid("이미 다른 주문에 사용된 키예요.");
            return orderResult(prior.get());
        }
        var lines=quantities.entrySet().stream().map(e->new GameOrder.Line(catalog.menu(store,e.getKey()),e.getValue())).toList();
        long total=lines.stream().mapToLong(l->l.price*l.quantity).sum();
        user.spend(total);
        user.gainExp(Math.max(10L, total / 10L));
        var order=new GameOrder("ord-"+UUID.randomUUID(),currentUserId,store,key,signature,total,user.getBalance(),now(),lines);
        orders.save(order);
        for(var line:lines)progress.recordSuccessfulPurchase(currentUserId,order.id+":"+line.menuId,line.menuId);
        return orderResult(order);
    }
    private OrderResult orderResult(GameOrder order) {
        return new OrderResult(order.id,order.storeId,order.totalPrice,order.remainingBalance,order.status(now()),15,
            order.lines.stream().map(l->new OrderItem(l.menuId,l.menuName,l.quantity,l.price)).toList());
    }
    public List<Receipt> receipts() {
        LocalDateTime time=now();
        long currentUserId = com.dandithon.backend.user.UserContext.getUserId();
        return orders.findByUserIdOrderByOrderedAtDescIdDesc(currentUserId).stream().flatMap(o->o.lines.stream().map(l->new Receipt(o.id,o.storeId,o.storeName,l.menuId,l.menuName,l.quantity,o.status(time),"ready".equals(o.status(time)),o.orderedAt))).toList();
    }
    public List<ReviewView> reviews(String storeId) {
        catalog.store(storeId);
        return reviews.findByStoreIdOrderByCreatedAtDescIdDesc(storeId).stream().map(r->new ReviewView(r.id,r.authorName,r.rating,r.text,date(r.createdAt),!r.imageUrls.isEmpty(),List.copyOf(r.imageUrls))).toList();
    }
    @Transactional
    public ReviewResult review(ReviewRequest request) {
        if(request==null||request.orderId()==null||request.rating()==null||request.rating()<1||request.rating()>5||request.text()==null)throw ApiException.invalid("주문·별점·리뷰 내용을 확인해 주세요.");
        String text=request.text().strip();
        if(text.isEmpty()||text.codePointCount(0,text.length())>500)throw ApiException.invalid("리뷰는 1~500자로 입력해 주세요.");
        var images=request.imageUrls()==null?List.<String>of():request.imageUrls();
        if(images.size()>5)throw ApiException.invalid("이미지는 최대 5개까지 첨부할 수 있어요.");
        for(String url:images) {
            if(url==null||url.length()>2048||url.isBlank())throw ApiException.invalid("이미지 주소를 확인해 주세요.");
            try {var uri=URI.create(url);if(!((url.startsWith("/assets/")||url.startsWith(ReviewPhotoService.PREFIX))&&!url.contains("..")||("https".equals(uri.getScheme())&&uri.getHost()!=null)))throw new IllegalArgumentException();}
            catch(IllegalArgumentException e){throw ApiException.invalid("이미지는 /assets/ 경로나 HTTPS 주소만 허용해요.");}
        }
        long currentUserId = com.dandithon.backend.user.UserContext.getUserId();
        var user=lockedUser();
        var order=orders.findById(request.orderId()).filter(o->o.userId==currentUserId).orElseThrow(()->new ApiException("ORDER_NOT_FOUND","주문을 찾을 수 없어요.",HttpStatus.NOT_FOUND));
        if(!"ready".equals(order.status(now())))throw new ApiException("INVALID_ORDER_STATUS","조리 완료 주문에 리뷰를 한 번만 작성할 수 있어요.",HttpStatus.BAD_REQUEST);
        var review=new GameReview(order,user.getNickname(),request.rating(),text,images,now());
        photos.attach(images,order.id,review.id);
        reviews.save(review);order.reviewed=true;
        return new ReviewResult(review.id,order.id,review.rating,review.text,review.authorName,date(review.createdAt));
    }
    public record ReviewDeleteResult(String reviewId, boolean deleted) {}
    @Transactional
    public ReviewDeleteResult deleteReview(String reviewId) {
        if (reviewId == null || reviewId.isBlank()) {
            throw ApiException.invalid("리뷰를 확인해 주세요.");
        }
        var review = reviews.findById(reviewId)
            .orElseThrow(() -> new ApiException("REVIEW_NOT_FOUND", "리뷰를 찾을 수 없어요.", HttpStatus.NOT_FOUND));
        long currentUserId = com.dandithon.backend.user.UserContext.getUserId();
        if (review.userId != currentUserId) {
            throw new ApiException("FORBIDDEN", "본인이 작성한 리뷰만 삭제할 수 있어요.", HttpStatus.FORBIDDEN);
        }
        if (review.orderId != null) {
            orders.findById(review.orderId).ifPresent(order -> order.reviewed = false);
        }
        photos.deleteForReview(review.id);
        reviews.delete(review);
        return new ReviewDeleteResult(reviewId, true);
    }
    GuestUser lockedUser() {
        long currentUserId = com.dandithon.backend.user.UserContext.getUserId();
        return users.findForUpdate(currentUserId).orElseThrow(() -> new ApiException("USER_NOT_FOUND", "사용자를 찾을 수 없어요.", HttpStatus.NOT_FOUND));
    }
    LocalDateTime now() {return LocalDateTime.now(clock.withZone(ZoneId.of("Asia/Seoul")));}
    private String date(LocalDateTime time) {return time.format(DateTimeFormatter.ofPattern("yyyy. MM. dd"));}
}
