package com.dandithon.backend.market;

import java.io.IOException;
import java.util.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

/** The fitted sklearn forest, exported without executable Python/pickle dependencies. */
@Component
public class SeomunEtaModel {
    public record Tree(int[] left,int[] right,int[] feature,double[] threshold,double[] value) {}
    public record Forest(int schemaVersion,String modelVersion,String dataSource,List<String> features,
                         int minimumQuantity,int maximumQuantity,String datasetSha256,List<Tree> trees) {}
    private final Forest forest;
    public SeomunEtaModel(ObjectMapper mapper,MarketCatalog catalog) throws IOException {
        try(var in=new ClassPathResource("eta/seomun-model.json").getInputStream()) {
            forest=mapper.readValue(in,Forest.class);
        }
        Set<String> menus=new HashSet<>();catalog.store("seomun").menus().forEach(m->menus.add(m.id()));
        if(forest.schemaVersion()!=1||!"SYNTHETIC".equals(forest.dataSource())||forest.trees().isEmpty()
            ||!forest.features().equals(List.of("tteok","sundae","fried","fish"))||!menus.equals(new HashSet<>(forest.features())))
            throw new IllegalStateException("서문분식 모델과 메뉴 계약이 맞지 않습니다.");
    }
    public String version(){return forest.modelVersion();}
    public double predict(Map<String,Integer> quantities) {
        float[] values=new float[forest.features().size()];
        for(int i=0;i<values.length;i++) {
            int q=quantities.getOrDefault(forest.features().get(i),0);
            if(q<forest.minimumQuantity()||q>forest.maximumQuantity())throw new IllegalArgumentException("Model input out of range");
            values[i]=q;
        }
        double sum=0;
        for(Tree tree:forest.trees()) {
            int node=0;
            while(tree.left()[node]!=-1)node=values[tree.feature()[node]]<=tree.threshold()[node]?tree.left()[node]:tree.right()[node];
            sum+=tree.value()[node];
        }
        double minutes=sum/forest.trees().size();
        if(!Double.isFinite(minutes)||minutes<=0)throw new IllegalStateException("Invalid ETA model output");
        return minutes;
    }
}
