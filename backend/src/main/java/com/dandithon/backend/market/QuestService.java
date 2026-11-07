package com.dandithon.backend.market;

import com.dandithon.backend.common.ApiException;
import com.dandithon.backend.user.UserRepository;
import java.time.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional(readOnly=true)
public class QuestService {
    private final ReviewRepository reviews;
    private final QuestClaimRepository claims;
    private final UserRepository users;
    private final DailyActivityService activities;
    private final MarketCatalog catalog;
    public QuestService(ReviewRepository reviews,QuestClaimRepository claims,UserRepository users,DailyActivityService activities,MarketCatalog catalog) {
        this.reviews=reviews;this.claims=claims;this.users=users;this.activities=activities;this.catalog=catalog;
    }
    public record Quest(String id,String title,long current,int target,int rewardCoin,String status,boolean verificationPending) {}
    public record ClaimResult(String questId,int rewardCoin,long currentBalance) {}
    private record Definition(String id,String title,int target,int reward) {}
    private static final List<Definition> DAILY=List.of(
        new Definition("visit-3","가게 3곳 둘러보기",3,300),
        new Definition("review-1","서문분식 리뷰 1개 작성하기",1,200),
        new Definition("equip-hat","모자 착용해보기",1,100));
    private String claimId(long userId,String questId,LocalDate day) {return userId+":"+questId+":"+day;}
    private long current(long userId,String questId,LocalDate day) {
        return switch(questId) {
            case "visit-3" -> activities.count(userId,day,DailyActivityService.BROWSE_STORE);
            case "equip-hat" -> activities.count(userId,day,DailyActivityService.WEAR_HAT);
            case "review-1" -> reviews.countByUserIdAndStoreIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(userId,"seomun",day.atStartOfDay(),day.plusDays(1).atStartOfDay());
            default -> throw ApiException.invalid("퀘스트를 찾을 수 없어요.");
        };
    }
    public Map<String,Object> list() {
        long currentUserId = com.dandithon.backend.user.UserContext.getUserId();
        LocalDate day=activities.today();
        var daily=DAILY.stream().map(def->{
            long count=current(currentUserId,def.id(),day);
            String status=claims.existsById(claimId(currentUserId,def.id(),day))?"CLAIMED":count>=def.target()?"COMPLETED":"IN_PROGRESS";
            return new Quest(def.id(),def.title(),Math.min(count,def.target()),def.target(),def.reward(),status,false);
        }).toList();
        return Map.of("daily",daily,"achievement",List.of(),"event",List.of());
    }
    @Transactional
    public Map<String,Object> browse(String storeId) {
        catalog.store(storeId);
        long currentUserId = com.dandithon.backend.user.UserContext.getUserId();
        users.findForUpdate(currentUserId).orElseThrow(() -> new ApiException("USER_NOT_FOUND", "사용자를 찾을 수 없어요.", HttpStatus.NOT_FOUND));
        activities.record(currentUserId,DailyActivityService.BROWSE_STORE,storeId);
        return list();
    }
    @Transactional
    public ClaimResult claim(String questId) {
        var def=DAILY.stream().filter(d->d.id().equals(questId)).findFirst().orElseThrow(()->ApiException.invalid("퀘스트를 찾을 수 없어요."));
        long currentUserId = com.dandithon.backend.user.UserContext.getUserId();
        var user=users.findForUpdate(currentUserId).orElseThrow(() -> new ApiException("USER_NOT_FOUND", "사용자를 찾을 수 없어요.", HttpStatus.NOT_FOUND));
        LocalDate day=activities.today();
        if(current(currentUserId,questId,day)<def.target()||claims.existsById(claimId(currentUserId,questId,day)))throw new ApiException("QUEST_NOT_COMPLETED","완료되지 않았거나 이미 보상을 받은 미션이에요.",HttpStatus.BAD_REQUEST);
        claims.save(new QuestClaim(claimId(currentUserId,questId,day), currentUserId));user.reward(def.reward());
        return new ClaimResult(questId,def.reward(),user.getBalance());
    }
}
