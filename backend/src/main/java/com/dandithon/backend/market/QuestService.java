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
    private final Clock clock;
    public QuestService(ReviewRepository reviews,QuestClaimRepository claims,UserRepository users,Clock clock) {
        this.reviews=reviews;this.claims=claims;this.users=users;this.clock=clock;
    }
    public record Quest(String id,String title,long current,int target,int rewardCoin,String status,boolean verificationPending) {}
    public record ClaimResult(String questId,int rewardCoin,long currentBalance) {}
    private LocalDate today() {return LocalDate.now(clock.withZone(ZoneId.of("Asia/Seoul")));}
    private String claimId(LocalDate day) {return "1:review-1:"+day;}
    private long reviewCount(LocalDate day) {return reviews.countByUserIdAndStoreIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(1,"seomun",day.atStartOfDay(),day.plusDays(1).atStartOfDay());}
    public Map<String,Object> list() {
        LocalDate day=today();long count=reviewCount(day);
        String status=claims.existsById(claimId(day))?"CLAIMED":count>=2?"COMPLETED":"IN_PROGRESS";
        return Map.of("daily",List.of(
            new Quest("visit-3","서문시장 가게 3곳 방문하기",0,3,300,"IN_PROGRESS",true),
            new Quest("review-1","서문 분식 방문 후 리뷰 작성하기",Math.min(count,2),2,200,status,false),
            new Quest("photo-1","사진 1장 찍기",0,1,100,"IN_PROGRESS",true)),
            "achievement",List.of(),"event",List.of());
    }
    @Transactional
    public ClaimResult claim(String questId) {
        if(!List.of("visit-3","review-1","photo-1").contains(questId))throw ApiException.invalid("퀘스트를 찾을 수 없어요.");
        var user=users.findForUpdate(1).orElseThrow(()->new ApiException("USER_NOT_FOUND","사용자를 찾을 수 없어요.",HttpStatus.NOT_FOUND));
        LocalDate day=today();
        if(!"review-1".equals(questId)||reviewCount(day)<2||claims.existsById(claimId(day)))throw new ApiException("QUEST_NOT_COMPLETED","완료되지 않았거나 이미 보상을 받은 미션이에요.",HttpStatus.BAD_REQUEST);
        claims.save(new QuestClaim(claimId(day)));user.reward(200);
        return new ClaimResult(questId,200,user.getBalance());
    }
}
