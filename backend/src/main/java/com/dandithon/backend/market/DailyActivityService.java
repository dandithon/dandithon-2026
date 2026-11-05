package com.dandithon.backend.market;

import java.time.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

@Service
public class DailyActivityService {
    public static final String BROWSE_STORE="BROWSE_STORE", WEAR_HAT="WEAR_HAT";
    private final DailyActivityRepository activities;
    private final Clock clock;
    public DailyActivityService(DailyActivityRepository activities,Clock clock) {this.activities=activities;this.clock=clock;}
    public LocalDate today() {return LocalDate.now(clock.withZone(ZoneId.of("Asia/Seoul")));}
    // Caller holds the user row lock; record and successful action commit together.
    @Transactional(propagation=Propagation.MANDATORY)
    public void record(long userId,String kind,String subjectId) {
        var activity=new DailyActivity(userId,today(),kind,subjectId);
        if(!activities.existsById(activity.id))activities.save(activity);
    }
    @Transactional(readOnly=true)
    public long count(long userId,LocalDate day,String kind) {
        return activities.countByUserIdAndActivityDayAndKind(userId,day,kind);
    }
}
