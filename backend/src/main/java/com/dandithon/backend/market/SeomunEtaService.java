package com.dandithon.backend.market;

import com.dandithon.backend.common.ApiException;
import java.time.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional(readOnly=true)
public class SeomunEtaService {
    private final SeomunEtaModel model;
    private final MarketCatalog catalog;
    private final OrderRepository orders;
    private final Clock clock;
    private final boolean enabled;
    private final int secondsPerMinute;
    public SeomunEtaService(SeomunEtaModel model,MarketCatalog catalog,OrderRepository orders,Clock clock,
            @Value("${eta.enabled:false}") boolean enabled,@Value("${eta.seconds-per-minute:5}") int secondsPerMinute) {
        if(secondsPerMinute<1||secondsPerMinute>60)throw new IllegalArgumentException("ETA seconds-per-minute must be 1..60");
        this.model=model;this.catalog=catalog;this.orders=orders;this.clock=clock;this.enabled=enabled;this.secondsPerMinute=secondsPerMinute;
    }
    public boolean enabled(){return enabled;}
    public record QueueView(String storeId,int activeOrders,double waitTimeMinutes,int npcCount,
                            String source,String modelVersion,boolean synthetic,int secondsPerSimulatedMinute,boolean appliedToOrders) {}
    public record Quote(String storeId,double queueWaitMinutes,double preparationMinutes,double estimatedMinutes,
                        int readyAfterSeconds,int npcCount,String source,String modelVersion,boolean synthetic,
                        int secondsPerSimulatedMinute,boolean appliedToOrders) {}
    public record Plan(LocalDateTime readyAt,int readyAfterSeconds,String modelVersion,int secondsPerMinute) {}
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
        return orders.findFirstByStoreIdAndReadyAtAfterOrderByReadyAtDesc("seomun",now).map(o->o.readyAt).orElse(now);
    }
    private double queueMinutes(LocalDateTime now){return Math.max(0,Duration.between(now,lastReady(now)).toMillis()/1000.0/secondsPerMinute);}
    public QueueView queue(String storeId) {
        supported(storeId);var now=now();double minutes=queueMinutes(now);
        return new QueueView(storeId,(int)orders.countByStoreIdAndReadyAtAfter(storeId,now),round(minutes),npcCount(minutes),
            "SYNTHETIC_MODEL",model.version(),true,secondsPerMinute,enabled);
    }
    public Quote quote(String storeId,List<MarketService.ItemRequest> items) {
        var quantities=quantities(storeId,items);var now=now();double queue=queueMinutes(now),prep=model.predict(quantities);
        int seconds=Math.toIntExact((long)Math.ceil((queue+prep)*secondsPerMinute));
        return new Quote(storeId,round(queue),round(prep),round(queue+prep),seconds,npcCount(queue+prep),
            "SYNTHETIC_MODEL",model.version(),true,secondsPerMinute,enabled);
    }
    // Called only while holding the guest user write lock, after replay detection.
    public Plan plan(String storeId,Map<String,Integer> quantities,LocalDateTime now) {
        if(!enabled||!"seomun".equals(storeId))return new Plan(now.plusSeconds(15),15,null,60);
        var start=lastReady(now);
        var ready=start.plusSeconds((long)Math.ceil(model.predict(quantities)*secondsPerMinute));
        return new Plan(ready,Math.toIntExact(Duration.between(now,ready).toSeconds()),model.version(),secondsPerMinute);
    }
    public static int npcCount(double minutes){return minutes<=0?0:(int)Math.min(10,Math.ceil(minutes/3));}
    private static double round(double value){return Math.round(value*100)/100.0;}
}
