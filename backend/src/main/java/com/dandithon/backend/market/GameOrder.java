package com.dandithon.backend.market;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.*;

@Entity @Table(name="game_orders",uniqueConstraints=@UniqueConstraint(columnNames={"user_id","request_key"}))
public class GameOrder {
    @Id @Column(length=64) public String id;
    @Column(name="user_id",nullable=false) public long userId;
    @Column(name="store_id",nullable=false,length=64) String storeId;
    @Column(name="store_name",nullable=false,length=100) String storeName;
    @Column(name="request_key",nullable=false,length=128) String requestKey;
    @Column(name="request_signature",nullable=false,length=2048) String requestSignature;
    @Column(name="total_price",nullable=false) long totalPrice;
    @Column(name="remaining_balance",nullable=false) long remainingBalance;
    @Column(name="ordered_at",nullable=false) LocalDateTime orderedAt;
    @Column(nullable=false) boolean reviewed;
    @ElementCollection @CollectionTable(name="order_lines",joinColumns=@JoinColumn(name="order_id"))
    @OrderColumn(name="line_number") List<Line> lines=new ArrayList<>();
    @Embeddable public static class Line {
        @Column(name="menu_id",nullable=false,length=64) String menuId;
        @Column(name="menu_name",nullable=false,length=100) String menuName;
        @Column(nullable=false) int quantity;
        @Column(nullable=false) long price;
        protected Line() {}
        Line(MarketCatalog.Menu menu,int quantity) {menuId=menu.id();menuName=menu.name();price=menu.price();this.quantity=quantity;}
    }
    protected GameOrder() {}
    GameOrder(String id,MarketCatalog.Store store,String key,String signature,long total,long balance,LocalDateTime now,List<Line> lines) {
        this(id, 1L, store, key, signature, total, balance, now, lines);
    }
    GameOrder(String id,long userId,MarketCatalog.Store store,String key,String signature,long total,long balance,LocalDateTime now,List<Line> lines) {
        this.id=id;this.userId=userId;storeId=store.id();storeName=store.name();requestKey=key;requestSignature=signature;
        totalPrice=total;remainingBalance=balance;orderedAt=now;this.lines.addAll(lines);
    }
    String status(LocalDateTime now) {return reviewed?"reviewed":now.isBefore(orderedAt.plusSeconds(15))?"cooking":"ready";}
}
