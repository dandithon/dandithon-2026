package com.dandithon.backend.profile;
import jakarta.persistence.*;
@Entity @Table(name="food_progress", uniqueConstraints=@UniqueConstraint(columnNames={"user_id","food_id"}))
public class FoodProgress {
    @Id @Column(length=128) private String id;
    @Column(name="user_id",nullable=false) private long userId;
    @Column(name="food_id",nullable=false,length=64) private String foodId;
    @Column(name="purchase_count",nullable=false) private long purchaseCount;
    protected FoodProgress() {}
    public FoodProgress(long userId,String foodId) { this.id=userId+":"+foodId;this.userId=userId;this.foodId=foodId; }
    public String getFoodId() { return foodId; }
    public long getPurchaseCount() { return purchaseCount; }
    public void increment() { purchaseCount=Math.addExact(purchaseCount,1); }
}
