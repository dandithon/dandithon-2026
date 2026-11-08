package com.dandithon.backend.market;
import com.dandithon.backend.common.ApiException;
import com.dandithon.backend.user.UserRepository;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;
import java.time.*;
import java.util.*;
import javax.imageio.ImageIO;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ReviewPhotoService {
    public static final String PREFIX="/api/v1/review-photos/";
    private final ReviewPhotoRepository photos;
    private final OrderRepository orders;
    private final UserRepository users;
    private final Clock clock;
    public ReviewPhotoService(ReviewPhotoRepository photos,OrderRepository orders,UserRepository users,Clock clock){this.photos=photos;this.orders=orders;this.users=users;this.clock=clock;}
    public record Uploaded(String id,String url) {}
    @Transactional
    public Uploaded upload(String orderId,MultipartFile file){
        long currentUserId = com.dandithon.backend.user.UserContext.getUserId();
        users.findForUpdate(currentUserId).orElseThrow(() -> ApiException.invalid("사용자를 확인해 주세요."));
        var order=orders.findById(orderId).filter(o->o.userId==currentUserId).orElseThrow(()->ApiException.invalid("사진을 첨부할 주문을 확인해 주세요."));
        if(order.reviewed)throw ApiException.invalid("리뷰를 작성할 수 있는 주문에 사진을 첨부해 주세요.");
        photos.deleteByReviewIdIsNullAndCreatedAtBefore(now().minusHours(24));
        if(photos.count()>=200||photos.countByOrderIdAndReviewIdIsNull(orderId)>=20)throw ApiException.invalid("사진 저장 공간이 부족해요. 사진 없이 등록하거나 잠시 후 다시 시도해 주세요.");
        if(file==null||file.isEmpty()||file.getSize()>8*1024*1024)throw ApiException.invalid("사진은 한 장당 8MB 이하로 선택해 주세요.");
        byte[] data=normalize(file);
        String id=UUID.randomUUID().toString();photos.save(new ReviewPhoto(id,orderId,data,now()));
        return new Uploaded(id,PREFIX+id);
    }
    private byte[] normalize(MultipartFile file){
        try(var input=ImageIO.createImageInputStream(file.getInputStream())){
            if(input==null)throw ApiException.invalid("사진 파일을 확인해 주세요.");
            var readers=ImageIO.getImageReaders(input);
            if(!readers.hasNext())throw ApiException.invalid("JPEG 또는 PNG 사진을 선택해 주세요.");
            var reader=readers.next();
            try{
                String format=reader.getFormatName();
                if(!format.equalsIgnoreCase("jpeg")&&!format.equalsIgnoreCase("png"))throw ApiException.invalid("JPEG 또는 PNG 사진을 선택해 주세요.");
                reader.setInput(input);int w=reader.getWidth(0),h=reader.getHeight(0);
                if(w<1||h<1||(long)w*h>25_000_000L)throw ApiException.invalid("사진 해상도가 너무 커요. 작은 크기로 다시 선택해 주세요.");
                BufferedImage original=reader.read(0);double scale=Math.min(1,1280.0/Math.max(w,h));
                BufferedImage clean=new BufferedImage(Math.max(1,(int)(w*scale)),Math.max(1,(int)(h*scale)),BufferedImage.TYPE_INT_RGB);
                Graphics2D graphics=clean.createGraphics();graphics.setColor(Color.WHITE);graphics.fillRect(0,0,clean.getWidth(),clean.getHeight());
                graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION,RenderingHints.VALUE_INTERPOLATION_BILINEAR);
                graphics.drawImage(original,0,0,clean.getWidth(),clean.getHeight(),null);graphics.dispose();
                var output=new ByteArrayOutputStream();ImageIO.write(clean,"jpeg",output);
                if(output.size()>2*1024*1024)throw ApiException.invalid("사진 용량을 줄여 다시 선택해 주세요.");
                return output.toByteArray();
            }finally{reader.dispose();}
        }catch(IOException ex){throw ApiException.invalid("사진을 읽지 못했어요. JPEG 또는 PNG로 다시 선택해 주세요.");}
    }
    @Transactional(readOnly=true)
    public byte[] read(String id){return photos.findById(id).orElseThrow(()->new ApiException("PHOTO_NOT_FOUND","사진을 찾을 수 없어요.",HttpStatus.NOT_FOUND)).data;}
    @Transactional public void deleteForReview(String id){photos.deleteByReviewId(id);}
    @Transactional public void deleteForOrders(Collection<String> orderIds){if(orderIds!=null&&!orderIds.isEmpty())photos.deleteByOrderIdIn(orderIds);}
    @Transactional public void reset(){photos.deleteAll();}
    @Transactional
    public void attach(java.util.List<String> urls,String orderId,String reviewId){
        for(String url:urls){
            if(!url.startsWith(PREFIX))continue;
            var photo=photos.findById(url.substring(PREFIX.length())).orElseThrow(()->ApiException.invalid("첨부 사진이 만료됐어요. 사진을 다시 선택해 주세요."));
            if(!photo.orderId.equals(orderId)||photo.reviewId!=null)throw ApiException.invalid("이 주문에 업로드한 사진만 첨부할 수 있어요.");
            photo.reviewId=reviewId;
        }
    }
    private LocalDateTime now(){return LocalDateTime.now(clock.withZone(ZoneId.of("Asia/Seoul")));}
}
