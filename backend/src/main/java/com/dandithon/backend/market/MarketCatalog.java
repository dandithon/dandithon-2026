package com.dandithon.backend.market;

import com.dandithon.backend.common.ApiException;
import java.io.IOException;
import java.util.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
public class MarketCatalog {
    public record Menu(String storeId,String id,String name,long price,String description,boolean isFeatured,String imageUrl) {}
    public record Store(String id,String name,String category,String description,String greeting,String location,String businessHours,String phone,List<String> tags,int waitTimeMinutes,List<Menu> menus) {}
    private final List<Store> stores;
    public MarketCatalog(ObjectMapper mapper) throws IOException {
        try(var input=new ClassPathResource("market-catalog.json").getInputStream()) {
            stores=List.of(mapper.readValue(input,Store[].class));
        }
    }
    public List<Store> stores() { return stores; }
    public Store store(String id) {
        return stores.stream().filter(s->s.id().equals(id)).findFirst()
            .orElseThrow(()->new ApiException("STORE_NOT_FOUND","가게를 찾을 수 없어요.",HttpStatus.NOT_FOUND));
    }
    public Menu menu(Store store,String id) {
        return store.menus().stream().filter(m->m.id().equals(id)).findFirst()
            .orElseThrow(()->new ApiException("MENU_NOT_FOUND","해당 가게의 메뉴를 찾을 수 없어요.",HttpStatus.NOT_FOUND));
    }
}
