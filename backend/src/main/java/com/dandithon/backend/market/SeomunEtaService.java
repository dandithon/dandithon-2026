package com.dandithon.backend.market;

import com.dandithon.backend.common.ApiException;
import com.dandithon.backend.user.UserRepository;
import org.springframework.http.HttpStatus;
import java.time.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional(readOnly=true)
public class SeomunEtaService {
    private final SeomunEtaModel model;
    private final MarketCatalog catalog;
    private final DemoQueueRepository orders;
    private final UserRepository users;
    private final Clock clock;
    private final boolean enabled;
    private final int secondsPerMinute;
    public SeomunEtaService(SeomunEtaModel model,MarketCatalog catalog,DemoQueueRepository orders,UserRepository users,Clock clock,
            @Value("${eta.enabled:true}") boolean enabled,@Value("${eta.seconds-per-minute:60}") int secondsPerMinute) {
        if(secondsPerMinute<1||secondsPerMinute>60)throw new IllegalArgumentException("ETA seconds-per-minute must be 1..60");
        this.model=model;this.catalog=catalog;this.orders=orders;this.users=users;this.clock=clock;this.enabled=enabled;this.secondsPerMinute=secondsPerMinute;
    }
    public boolean enabled(){return enabled;}
    public record QueueView(String storeId,int activeOrders,double waitTimeMinutes,int npcCount,
                            String source,String modelVersion,boolean synthetic,int secondsPerSimulatedMinute,boolean appliedToOrders) {}
    public record Quote(String storeId,double queueWaitMinutes,double preparationMinutes,double estimatedMinutes,
                        int readyAfterSeconds,int npcCount,String source,String modelVersion,boolean synthetic,
                        int secondsPerSimulatedMinute,boolean appliedToOrders) {}
    LocalDateTime now(){return LocalDateTime.now(clock.withZone(ZoneId.of("Asia/Seoul")));}
    private void supported(String storeId){
        catalog.store(storeId);
        if(!"seomun".equals(storeId))throw ApiException.invalid("AI 시연 예측은 서문분식만 지원해요.");
    }
    public Map<String,Integer> quantities(String storeId,List<MarketService.ItemRequest> items) {
        supported(storeId);
        if(items==null||items.isEmpty()||items.size()>4)throw ApiException.invalid("서문분식 주문 메뉴를 확인해 주세요.");
        Map<String,Integer> quantities=new TreeMap<>();
        for(var item:items) {
            if(item==null||item.menuId()==null||item.quantity()==null||item.quantity()<1||item.quantity()>99)
                throw ApiException.invalid("메뉴 수량은 1~99 정수여야 해요.");
            catalog.menu(catalog.store(storeId),item.menuId());
            if(quantities.putIfAbsent(item.menuId(),item.quantity())!=null)throw ApiException.invalid("같은 메뉴의 수량은 합쳐 주세요.");
        }
        return quantities;
    }
    private LocalDateTime lastReady(LocalDateTime now){
        return orders.findFirstByReadyAtAfterOrderByReadyAtDesc(now).map(o->o.readyAt).orElse(now);
    }
    private double queueMinutes(LocalDateTime now){return Math.max(0,Duration.between(now,lastReady(now)).toMillis()/1000.0/secondsPerMinute);}
    public QueueView queue(String storeId) {
        supported(storeId);var now=now();double minutes=queueMinutes(now);
        return new QueueView(storeId,(int)orders.countByReadyAtAfter(now),round(minutes),npcCount(minutes),
            "SYNTHETIC_DEMO_QUEUE",model.version(),true,secondsPerMinute,false);
    }
    public Quote quote(String storeId,List<MarketService.ItemRequest> items) {
        var quantities=quantities(storeId,items);var now=now();double queue=queueMinutes(now),prep=model.predict(quantities);
        int seconds=Math.toIntExact((long)Math.ceil((queue+prep)*secondsPerMinute));
        return new Quote(storeId,round(queue),round(prep),round(queue+prep),seconds,npcCount(queue+prep),
            "SYNTHETIC_DEMO_QUEUE",model.version(),true,secondsPerMinute,false);
    }
    private void lockGuest(){users.findForUpdate(1).orElseThrow(()->new ApiException("USER_NOT_FOUND","사용자를 찾을 수 없어요.",HttpStatus.NOT_FOUND));}
    @Transactional
    public QueueView seed() {
        lockGuest();orders.deleteAllInBatch();
        var now=now();var ready=now;int index=0;
        // Seven fictional tickets; fitted prep times sum to about 20 simulated minutes.
        for(String menu:List.of("fried","tteok","sundae","fried","fish","tteok","fried")) {
            double minutes=model.predict(Map.of(menu,1));
            ready=ready.plusSeconds((long)Math.ceil(minutes*secondsPerMinute));
            orders.save(new DemoQueueOrder("demo-seomun-"+(++index),menu,minutes,now,ready,model.version()));
        }
        orders.flush();return queue("seomun");
    }
    @Transactional
    public QueueView clear() {lockGuest();orders.deleteAllInBatch();return queue("seomun");}
    public static int npcCount(double minutes){return minutes<=0?0:(int)Math.min(10,Math.ceil(minutes/3));}
    private static double round(double value){return Math.round(value*100)/100.0;}
}
