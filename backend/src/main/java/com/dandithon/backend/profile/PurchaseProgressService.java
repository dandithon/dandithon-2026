package com.dandithon.backend.profile;
import com.dandithon.backend.common.ApiException;
import com.dandithon.backend.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
@Service
public class PurchaseProgressService {
    private final UserRepository users;
    private final FoodProgressRepository progress;
    private final PurchaseEventRepository events;
    public PurchaseProgressService(UserRepository users,FoodProgressRepository progress,PurchaseEventRepository events) {
        this.users=users;this.progress=progress;this.events=events;
    }
    // BE2 must call inside the successful order transaction, once per menu line.
    // eventId must be a stable globally unique order-line ID, not a new UUID per retry.
    @Transactional(propagation=Propagation.MANDATORY)
    public void recordSuccessfulPurchase(long userId,String eventId,String foodId) {
        if(eventId==null||eventId.isBlank()||eventId.length()>128)throw ApiException.invalid("구매 기록 식별자를 확인해 주세요.");
        if(ProfileCatalog.FOODS.stream().noneMatch(f->f.id().equals(foodId)))throw new ApiException("MENU_NOT_FOUND","음식을 찾을 수 없어요.",HttpStatus.NOT_FOUND);
        users.findForUpdate(userId).orElseThrow(()->new ApiException("USER_NOT_FOUND","사용자를 찾을 수 없어요.",HttpStatus.NOT_FOUND));
        var prior=events.findById(eventId);
        if(prior.isPresent()) {
            if(!prior.get().matches(userId,foodId))throw ApiException.invalid("다른 구매에 사용된 기록 식별자예요.");
            return;
        }
        FoodProgress p=progress.findByUserIdAndFoodId(userId,foodId).orElseGet(()->new FoodProgress(userId,foodId));
        p.increment();progress.save(p);events.save(new PurchaseEvent(eventId,userId,foodId));
    }
}
