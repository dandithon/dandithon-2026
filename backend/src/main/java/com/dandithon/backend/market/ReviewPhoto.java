package com.dandithon.backend.market;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity @Table(name="review_photos")
public class ReviewPhoto {
    @Id @Column(length=36) String id;
    @Column(name="order_id",nullable=false,length=64) String orderId;
    @Column(name="review_id",length=64) String reviewId;
    @Column(name="created_at",nullable=false) LocalDateTime createdAt;
    @Lob @Column(name="image_data",nullable=false,columnDefinition="LONGBLOB") byte[] data;
    protected ReviewPhoto() {}
    ReviewPhoto(String id,String orderId,byte[] data,LocalDateTime createdAt){this.id=id;this.orderId=orderId;this.data=data;this.createdAt=createdAt;}
}
