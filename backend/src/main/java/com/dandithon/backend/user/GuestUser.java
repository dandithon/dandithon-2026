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
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name="user_favorites", joinColumns=@JoinColumn(name="user_id"))
    @Column(name="store_id", nullable=false, length=64)
    private java.util.Set<String> favorites = new java.util.LinkedHashSet<>();
    protected GuestUser() {}
    public GuestUser(long id) { this.id=id; nickname=id==1L?"승우":"게스트"+id; balance=1000; level=1; exp=0; nextLevelExp=100; }
    public Long getId() { return id; }
    public String getNickname() { return nickname; }
    public long getBalance() { return balance; }
    public int getLevel() { return level; }
    public long getExp() { return exp; }
    public long getNextLevelExp() { return nextLevelExp; }
    public Map<String,String> getEquipped() { return equipped; }
    public java.util.Set<String> getFavorites() { return favorites; }
    public void spend(long amount) {
        if(amount<=0)throw com.dandithon.backend.common.ApiException.invalid("결제 금액을 확인해 주세요.");
        if(balance<amount)throw new com.dandithon.backend.common.ApiException("INSUFFICIENT_BALANCE","보유 코인이 부족해요. 수량을 줄여 주세요.",org.springframework.http.HttpStatus.BAD_REQUEST);
        balance-=amount;
    }
    public void reward(long amount) {
        if(amount<=0)throw new IllegalArgumentException("Reward must be positive");
        balance=Math.addExact(balance,amount);
    }
    public void rename(String nickname) { this.nickname=nickname; }
    public void toggle(String slot, String id) {
        if(id.equals(equipped.get(slot))) equipped.remove(slot); else equipped.put(slot,id);
    }
    public boolean toggleFavorite(String storeId) {
        if (favorites.contains(storeId)) {
            favorites.remove(storeId);
            return false;
        } else {
            favorites.add(storeId);
            return true;
        }
    }
    public void gainExp(long gained) {
        if(gained<=0) return;
        this.exp = Math.addExact(this.exp, gained);
        while(this.exp >= this.nextLevelExp) {
            this.exp -= this.nextLevelExp;
            this.level++;
            this.nextLevelExp = (long) this.level * 100L;
        }
    }
    public void reset() {
        nickname = "승우";
        balance = 1000;
        level = 1;
        exp = 0;
        nextLevelExp = 100;
        equipped.clear();
        favorites.clear();
    }
}
