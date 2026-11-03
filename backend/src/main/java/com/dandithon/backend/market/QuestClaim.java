package com.dandithon.backend.market;
import jakarta.persistence.*;
@Entity @Table(name="quest_claims")
public class QuestClaim {
    @Id @Column(length=128) String id;
    @Column(name="user_id",nullable=false) long userId;
    protected QuestClaim() {}
    QuestClaim(String id) {this.id=id;userId=1;}
}
