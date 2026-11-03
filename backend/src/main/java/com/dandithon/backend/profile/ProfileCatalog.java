package com.dandithon.backend.profile;
import java.util.List;
// IDs and names match frontend/src/mocks/fixtures.js. No store/order implementation here.
public final class ProfileCatalog {
    private ProfileCatalog() {}
    public record Food(String id,String name) {}
    public record Equipment(String id,String name,String slot,String foodId,int required,String imageUrl) {}
    public static final List<Food> FOODS=List.of(
        new Food("tteok","떡볶이"),new Food("sundae","순대"),new Food("fried","튀김 세트"),new Food("fish","오뎅"),
        new Food("noodle-basic","멸치 칼국수"),new Food("noodle-spicy","얼큰 칼국수"),new Food("noodle-dumpling","손만두"),new Food("noodle-cold","비빔국수"),
        new Food("hotteok-seed","씨앗 호떡"),new Food("hotteok-cheese","치즈 호떡"),new Food("hotteok-honey","꿀 호떡"),new Food("hotteok-rice","식혜"),
        new Food("coffee-americano","아메리카노"),new Food("coffee-latte","카페라떼"),new Food("coffee-strawberry","딸기라떼"),new Food("coffee-waffle","크림 와플"));
    public static final List<Equipment> EQUIPMENT=List.of(
        new Equipment("tteok-hat","모자","head","tteok",1,"/assets/profile-imgImage112.png"),
        new Equipment("tteok-jacket","자켓","body","tteok",3,"/assets/profile-imgImage114.png"),
        new Equipment("tteok-shoes","신발","feet","tteok",5,"/assets/profile-imgImage113.png"),
        new Equipment("tteok-scarf","목도리","neck","tteok",8,"/assets/profile-imgImage123.png"));
}
