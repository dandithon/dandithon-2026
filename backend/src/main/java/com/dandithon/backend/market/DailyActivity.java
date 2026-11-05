package com.dandithon.backend.market;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity @Table(name="daily_activities")
public class DailyActivity {
    @Id @Column(length=160) String id;
    @Column(name="user_id",nullable=false) long userId;
    @Column(name="activity_day",nullable=false) LocalDate activityDay;
    @Column(nullable=false,length=32) String kind;
    @Column(name="subject_id",nullable=false,length=64) String subjectId;
    protected DailyActivity() {}
    DailyActivity(long userId,LocalDate day,String kind,String subjectId) {
        this.id=userId+":"+day+":"+kind+":"+subjectId;
        this.userId=userId;activityDay=day;this.kind=kind;this.subjectId=subjectId;
    }
}
