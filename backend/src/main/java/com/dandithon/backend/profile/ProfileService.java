package com.dandithon.backend.profile;
import com.dandithon.backend.common.ApiException;
import com.dandithon.backend.market.DailyActivityService;
import com.dandithon.backend.market.OrderRepository;
import com.dandithon.backend.market.QuestClaimRepository;
import com.dandithon.backend.market.ReviewRepository;
import com.dandithon.backend.user.*;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service @Transactional(readOnly=true)
public class ProfileService {
    private final UserRepository users;
    private final FoodProgressRepository progress;
    private final DailyActivityService activities;
    private final com.dandithon.backend.market.DailyActivityRepository dailyActivities;
    private final PurchaseEventRepository events;
    private final OrderRepository orders;
    private final ReviewRepository reviews;
    private final QuestClaimRepository claims;
    private final com.dandithon.backend.market.MarketCatalog catalog;
    public ProfileService(UserRepository users,FoodProgressRepository progress,DailyActivityService activities,com.dandithon.backend.market.DailyActivityRepository dailyActivities,PurchaseEventRepository events,OrderRepository orders,ReviewRepository reviews,QuestClaimRepository claims,com.dandithon.backend.market.MarketCatalog catalog) {
        this.users=users;this.progress=progress;this.activities=activities;this.dailyActivities=dailyActivities;this.events=events;this.orders=orders;this.reviews=reviews;this.claims=claims;this.catalog=catalog;
    }
    private GuestUser user(boolean write) {
        return (write?users.findForUpdate(1):users.findById(1L)).orElseThrow(()->new ApiException("USER_NOT_FOUND","사용자를 찾을 수 없어요.",HttpStatus.NOT_FOUND));
    }
    private Map<String,String> equipped(GuestUser u) {
        Map<String,String> result=new LinkedHashMap<>();
        for(String slot:List.of("head","body","feet","neck"))result.put(slot,u.getEquipped().get(slot));
        return result;
    }
    public record UserView(long userId,String nickname,long balance,int level,long exp,long nextLevelExp,Map<String,String> equipped,Set<String> favorites) {}
    public UserView me() { GuestUser u=user(false);return new UserView(u.getId(),u.getNickname(),u.getBalance(),u.getLevel(),u.getExp(),u.getNextLevelExp(),equipped(u),u.getFavorites()); }
    public record FavoritesView(Set<String> favorites) {}
    public record FavoriteToggleView(String storeId,boolean favorite,Set<String> favorites) {}
    public FavoritesView favorites() { return new FavoritesView(user(false).getFavorites()); }
    @Transactional
    public FavoriteToggleView toggleFavorite(String storeId) {
        if(storeId==null||storeId.isBlank())throw ApiException.invalid("가게를 확인해 주세요.");
        catalog.store(storeId);
        GuestUser u = user(true);
        boolean isFav = u.toggleFavorite(storeId);
        return new FavoriteToggleView(storeId, isFav, u.getFavorites());
    }
    @Transactional
    public UserView charge(Long amount) {
        long value = (amount != null && amount > 0) ? amount : 100_000L;
        if (value > 10_000_000L) throw ApiException.invalid("1회 최대 충전 금액은 10,000,000 코인이에요.");
        GuestUser u = user(true);
        u.reward(value);
        return me();
    }
    @Transactional
    public UserView gainExp(Long amount) {
        long value = (amount != null && amount > 0) ? amount : 50L;
        if (value > 100_000L) throw ApiException.invalid("1회 최대 경험치 획득량은 100,000이에요.");
        GuestUser u = user(true);
        u.gainExp(value);
        return me();
    }
    @Transactional
    public UserView resetDemo() {
        GuestUser u = user(true);
        u.reset();
        reviews.deleteAll();
        orders.deleteAll();
        events.deleteAll();
        progress.deleteAll();
        claims.deleteAll();
        dailyActivities.deleteAll();
        return me();
    }
    public record NicknameView(String nickname) {}
    @Transactional
    public NicknameView rename(String value) {
        if(value==null)throw ApiException.invalid("닉네임을 입력해 주세요.");
        String name=value.strip();
        if(name.isBlank()||name.codePointCount(0,name.length())>8||name.codePoints().anyMatch(Character::isISOControl))
            throw ApiException.invalid("닉네임은 제어문자 없이 1~8자로 입력해 주세요.");
        GuestUser u=user(true);u.rename(name);return new NicknameView(name);
    }
    private Map<String,Long> counts(long id) {
        return progress.findByUserId(id).stream().collect(Collectors.toMap(FoodProgress::getFoodId,FoodProgress::getPurchaseCount));
    }
    public record EquipmentView(String id,String name,String slot,String targetFoodId,String targetFoodName,int requiredCount,long currentCount,boolean unlocked,boolean isEquipped,String imageUrl) {}
    public record EquipmentsView(List<EquipmentView> equipments) {}
    public EquipmentsView equipment() {
        GuestUser u=user(false);Map<String,Long> counts=counts(u.getId());
        return new EquipmentsView(ProfileCatalog.EQUIPMENT.stream().map(e->{long n=counts.getOrDefault(e.foodId(),0L);
            return new EquipmentView(e.id(),e.name(),e.slot(),e.foodId(),"떡볶이",e.required(),n,n>=e.required(),e.id().equals(u.getEquipped().get(e.slot())),e.imageUrl());}).toList());
    }
    public record EquippedView(Map<String,String> equipped) {}
    @Transactional
    public EquippedView toggle(String id) {
        var item=ProfileCatalog.EQUIPMENT.stream().filter(e->e.id().equals(id)).findFirst().orElseThrow(()->ApiException.invalid("장비를 확인해 주세요."));
        GuestUser u=user(true);
        long count=progress.findByUserIdAndFoodId(u.getId(),item.foodId()).map(FoodProgress::getPurchaseCount).orElse(0L);
        if(count<item.required())throw new ApiException("EQUIPMENT_LOCKED","아직 획득하지 않은 장비예요.",HttpStatus.BAD_REQUEST);
        u.toggle(item.slot(),id);
        if("tteok-hat".equals(id)&&id.equals(u.getEquipped().get("head")))activities.record(u.getId(),DailyActivityService.WEAR_HAT,id);
        return new EquippedView(equipped(u));
    }
    public record BadgeView(String tier,String name,int required,boolean earned) {}
    public record NextBadgeView(String tier,String name,long remainingCount) {}
    public record FoodView(String foodId,String foodName,long purchaseCount,List<BadgeView> badges,NextBadgeView nextBadge) {}
    public record BadgesView(List<FoodView> foods) {}
    public BadgesView badges() {
        Map<String,Long> counts=counts(user(false).getId());
        return new BadgesView(ProfileCatalog.FOODS.stream().map(f->{long n=counts.getOrDefault(f.id(),0L);
            List<BadgeView> badges=List.of(new BadgeView("BRONZE","브론즈",3,n>=3),new BadgeView("SILVER","실버",5,n>=5),new BadgeView("GOLD","골드",10,n>=10));
            NextBadgeView next=badges.stream().filter(b->!b.earned()).findFirst().map(b->new NextBadgeView(b.tier(),b.name(),b.required()-n)).orElse(null);
            return new FoodView(f.id(),f.name(),n,badges,next);}).toList());
    }
}
