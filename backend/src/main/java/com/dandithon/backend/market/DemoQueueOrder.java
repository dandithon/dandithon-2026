package com.dandithon.backend.market;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/** Fictional general-customer ticket: never a paid guest order or purchase event. */
@Entity @Table(name="seomun_demo_queue")
public class DemoQueueOrder {
    @Id @Column(length=64) String id;
    @Column(name="menu_id",nullable=false,length=64) String menuId;
    @Column(nullable=false) int quantity;
    @Column(name="preparation_minutes",nullable=false) double preparationMinutes;
    @Column(name="created_at",nullable=false) LocalDateTime createdAt;
    @Column(name="ready_at",nullable=false) LocalDateTime readyAt;
    @Column(name="model_version",nullable=false,length=80) String modelVersion;
    protected DemoQueueOrder() {}
    DemoQueueOrder(String id,String menuId,double minutes,LocalDateTime now,LocalDateTime readyAt,String version) {
        this.id=id;this.menuId=menuId;quantity=1;preparationMinutes=minutes;createdAt=now;this.readyAt=readyAt;modelVersion=version;
    }
}
