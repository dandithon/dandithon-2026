package com.dandithon.backend.market;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.*;
@Entity @Table(name="game_reviews")
public class GameReview {
    @Id @Column(length=64) public String id;
    @Column(name="order_id",nullable=false,unique=true,length=64) String orderId;
    @Column(name="user_id",nullable=false) long userId;
    @Column(name="store_id",nullable=false,length=64) String storeId;
    @Column(name="author_name",nullable=false,length=32) String authorName;
    @Column(nullable=false) int rating;
    @Column(name="review_text",nullable=false,length=2000) String text;
    @Column(name="created_at",nullable=false) LocalDateTime createdAt;
    @ElementCollection @CollectionTable(name="review_images",joinColumns=@JoinColumn(name="review_id"))
    @OrderColumn(name="image_number") @Column(name="image_url",nullable=false,length=2048) List<String> imageUrls=new ArrayList<>();
    protected GameReview() {}
    GameReview(GameOrder order,String author,int rating,String text,List<String> images,LocalDateTime now) {
        id="rev-"+UUID.randomUUID();orderId=order.id;userId=order.userId;storeId=order.storeId;
        authorName=author;this.rating=rating;this.text=text;imageUrls.addAll(images);createdAt=now;
    }
}
