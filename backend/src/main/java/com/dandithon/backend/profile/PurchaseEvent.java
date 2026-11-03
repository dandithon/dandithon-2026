package com.dandithon.backend.profile;
import jakarta.persistence.*;
@Entity @Table(name="purchase_events")
public class PurchaseEvent {
    @Id @Column(name="event_id",length=128) private String eventId;
    @Column(name="user_id",nullable=false) private long userId;
    @Column(name="food_id",nullable=false,length=64) private String foodId;
    protected PurchaseEvent() {}
    public PurchaseEvent(String eventId,long userId,String foodId) { this.eventId=eventId;this.userId=userId;this.foodId=foodId; }
    public boolean matches(long userId,String foodId) { return this.userId==userId && this.foodId.equals(foodId); }
}
