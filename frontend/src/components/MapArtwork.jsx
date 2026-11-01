import React from 'react';
import PlayerCharacter from './PlayerCharacter';
export default function MapArtwork({ assets, nickname = '승우', equipped = {}, balance = 1000, joystick = true, position = {x:0,y:0}, direction = 'up', moving = false, overlay = false, layer = 'hud', camera = {zoom:1,x:0,y:0}, stick = {x:0,y:0}, children }) {
  const { imgImage7, imgImage5, imgImage11, imgImage12, imgImage13, imgImage15, imgImage16, imgImage4, imgImage87, imgImage20 } = assets;
  if(layer==='world')return <div className="absolute inset-0 origin-top-left" style={{transform:`translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`}}>
      <div className="absolute h-[875px] left-0 top-[-1px] w-[405px]" data-node-id="40:42" data-name="image 7">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage7} />
      </div>
      <p className="[word-break:break-word] absolute font-pixel leading-[normal] left-[295px] not-italic text-[#302019] text-[13px] top-[509px] tracking-[-0.13px] whitespace-nowrap" style={{ top: overlay ? 517 : undefined }} data-node-id="40:111">
        커피.디저트
      </p>
      <p className="[word-break:break-word] absolute font-pixel leading-[normal] left-[308px] not-italic text-[#302019] text-[13px] top-[153px] tracking-[-0.13px] whitespace-nowrap" style={{ top: overlay ? 169 : undefined }} data-node-id="40:113">
        칼국수
      </p>
      <div className="absolute contents left-[154px] top-[320px]" data-node-id="125:1136">
        <div className="absolute h-[86px] left-[154px] top-[320px] w-[97px]" style={{ transform: `translate(${position.x}px, ${position.y}px)` }} data-node-id="40:45" data-name="image 5">
          <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage5} />
        </div>
      </div>
      <p className="[word-break:break-word] absolute font-pixel leading-[normal] left-[54px] not-italic text-[#302019] text-[13px] top-[153px] tracking-[-0.13px] whitespace-nowrap" style={{ top: overlay ? 169 : undefined }} data-node-id="40:47">
        서문분식
      </p>
      <p className="[word-break:break-word] absolute font-pixel leading-[normal] left-[65px] not-italic text-[#302019] text-[13px] top-[509px] tracking-[-0.13px] whitespace-nowrap" style={{ top: overlay ? 517 : undefined }} data-node-id="40:109">
        호떡
      </p>
      <div className="absolute contents left-[168px] top-[383px]" data-node-id="125:1137">
        <div className="absolute h-[72px] left-[168px] top-[388px] w-[67px]" style={{ transform: `translate(${position.x}px, ${position.y}px)` }} data-node-id="125:1134" data-name="image 87">
          <div className="size-full" style={{transform:"scaleX(.9)"}}><PlayerCharacter moving={moving} equipped={equipped} direction={direction} backImage={imgImage87}/></div>
        </div>
      </div>
{children}</div>;
  return (
    <div className="relative size-full" data-node-id="40:41" data-name="버튼 ver.2">
      <div className="absolute bg-[#1e252b] blur-[12.5px] h-[874px] left-[314px] opacity-50 top-0 w-[91px]" />
      <div className="absolute left-[327px] size-[64px] top-[258px]" data-node-id="39:39" data-name="image 11">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-full left-[-22.86%] max-w-none top-0 w-[131.19%]" src={imgImage11} />
        </div>
      </div>
      <div className="absolute left-[328px] size-[64px] top-[174px]" data-node-id="39:33" data-name="image 11">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-full left-[-23.9%] max-w-none top-[-0.06%] w-[126.35%]" src={imgImage12} />
        </div>
      </div>
      <div className="absolute left-[327px] size-[64px] top-[264px]" data-node-id="39:34" data-name="image 12" />
      <div className="absolute left-[327px] size-[64px] top-[342px]" data-node-id="39:35" data-name="image 13">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-full left-[-12.39%] max-w-none top-[-0.27%] w-[117.18%]" src={imgImage13} />
        </div>
      </div>
      <div className="absolute h-[219px] left-[-23px] top-[630px] w-[240px]" style={{ display: joystick ? undefined : "none" }} data-node-id="40:58" data-name="image 15">
        <div className="absolute rounded-full" style={{left:82,top:77,width:76,height:76,background:"#66584e"}}/>
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage15} style={{maskImage:"radial-gradient(circle at 50% 52.5%, transparent 36px, black 37px)"}} />
        <img alt="" className="absolute inset-0 pointer-events-none size-full" src={imgImage15} style={{clipPath:"circle(37px at 50% 52.5%)",transform:`translate(${stick.x}px, ${stick.y}px)`}} />
      </div>
      <div className="absolute h-[63px] left-[306px] top-[761px] w-[93px]" data-node-id="40:64" data-name="image 16">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage16} />
      </div>
      <div className="absolute contents left-[189px] top-[52px]" data-node-id="40:83">
        <div className="absolute h-[71px] left-[189px] top-[52px] w-[213px]" data-node-id="40:44" data-name="image 4">
          <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage4} />
        </div>
        <p className="[word-break:break-word] absolute font-retro leading-[normal] left-[362px] not-italic text-[30px] text-black top-[69px] tracking-[-0.3px] whitespace-nowrap" data-node-id="40:80">
          +
        </p>
        <p className="[word-break:break-word] absolute font-retro leading-[normal] left-[266px] not-italic text-[20px] text-white top-[76px] tracking-[-0.2px] whitespace-nowrap" data-node-id="113:993">
          {balance.toLocaleString('ko-KR')}
        </p>
      </div>
      <div className="absolute contents left-[5px] top-[47px]" data-node-id="121:1054">
        <div className="absolute h-[71px] left-[5px] top-[47px] w-[178px]" data-node-id="40:134" data-name="image 20">
          <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage20} />
        </div>
        <div className="absolute contents left-[104px] top-[77px]" data-node-id="40:142">
          <p className="[word-break:break-word] absolute font-retro leading-[normal] left-[78px] w-[95px] truncate text-center not-italic text-[15px] text-white top-[77px] tracking-[-0.15px] whitespace-nowrap" data-node-id="40:140">
            {nickname}
          </p>
        </div>
      </div>
    </div>
  );
}
