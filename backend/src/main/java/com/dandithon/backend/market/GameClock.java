package com.dandithon.backend.market;
import java.time.*;
import org.springframework.context.annotation.*;
@Configuration
public class GameClock {
    @Bean Clock marketClock() {return Clock.system(ZoneId.of("Asia/Seoul"));}
}
