package com.dandithon.backend.user;
import jakarta.persistence.*;
import java.util.LinkedHashMap;
import java.util.Map;
@Entity @Table(name="app_users")
public class GuestUser {
    @Id private Long id;
    @Column(nullable=false, length=32) private String nickname;
    @Column(nullable=false) private long balance;
    @Column(name="user_level", nullable=false) private int level;
    @Column(nullable=false) private long exp;
    @Column(name="next_level_exp", nullable=false) private long nextLevelExp;
    @ElementCollection
    @CollectionTable(name="equipped_items", joinColumns=@JoinColumn(name="user_id"))
    @MapKeyColumn(name="slot", length=16)
    @Column(name="equipment_id", nullable=false, length=64)
    private Map<String,String> equipped = new LinkedHashMap<>();
    protected GuestUser() {}
    public GuestUser(long id) { this.id=id; nickname="승우"; balance=1000; level=1; exp=0; nextLevelExp=100; }
    public Long getId() { return id; }
    public String getNickname() { return nickname; }
    public long getBalance() { return balance; }
    public int getLevel() { return level; }
    public long getExp() { return exp; }
    public long getNextLevelExp() { return nextLevelExp; }
    public Map<String,String> getEquipped() { return equipped; }
    public void rename(String nickname) { this.nickname=nickname; }
    public void toggle(String slot, String id) {
        if(id.equals(equipped.get(slot))) equipped.remove(slot); else equipped.put(slot,id);
    }
}
