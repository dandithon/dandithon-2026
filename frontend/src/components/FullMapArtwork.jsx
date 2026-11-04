import React from 'react';
import assets from '../assets/exploration.json';
const {imgImage124,imgImage125,imgImage126,imgImage127,imgImage128}=assets.map;
export default function FullMapArtwork({zones}) {
  return (
    <div className="bg-white relative size-full" data-node-id="1:528" data-name="전체지도">
      <div className="absolute h-[874px] left-0 top-0 w-[402px]" data-node-id="1:529" data-name="image 124">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage124} />
      </div>
      <p className="[word-break:break-word] absolute font-retro leading-[15px] left-[calc(50%-66px)] not-italic text-[#4a2c20] text-[20px] top-[65px] tracking-[0.2px] whitespace-nowrap" data-node-id="1:530">
        서문시장 지도
      </p>
      <div className="absolute h-[101px] left-[19px] top-[132px] w-[156px]" data-node-id="1:531" data-name="image 126">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage126} />
      </div>
      <div className="absolute h-[99px] left-[210px] top-[154px] w-[152px]" data-node-id="1:532" data-name="image 125">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage125} />
      </div>
      <div className="absolute h-[105px] left-[19px] top-[320px] w-[161px]" data-node-id="1:533" data-name="image 128">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage128} />
      </div>
      <div className="absolute h-[101px] left-[207px] top-[481px] w-[156px]" data-node-id="1:534" data-name="image 127">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage127} />
      </div>
      <p className="[word-break:break-word] absolute font-pixel leading-[15px] left-[75px] not-italic text-[#493024] text-[15px] top-[173px] tracking-[0.15px] whitespace-nowrap" data-node-id="1:535">
        {zones?zones.find(z=>z.id==='zone-1')?.name:'1지구'}
      </p>
      <p className="[word-break:break-word] absolute font-pixel leading-[15px] left-[69px] not-italic text-[#493024] text-[15px] top-[364px] tracking-[0.15px] whitespace-nowrap" data-node-id="1:536">
        {zones?zones.find(z=>z.id==='zone-dongsan')?.name:'동산상가'}
      </p>
      <p className="[word-break:break-word] absolute font-pixel leading-[15px] left-[263px] not-italic text-[#493024] text-[15px] top-[195px] tracking-[0.15px] whitespace-nowrap" data-node-id="1:537">
        {zones?zones.find(z=>z.id==='zone-2')?.name:'2지구'}
      </p>
      <p className="[word-break:break-word] absolute font-pixel leading-[15px] left-[258px] not-italic text-[#493024] text-[15px] top-[516px] tracking-[0.15px] whitespace-nowrap" data-node-id="1:538">
        {zones?zones.find(z=>z.id==='zone-night')?.name:'야시장'}
      </p>
      <p className="[word-break:break-word] absolute font-sans font-medium leading-[15px] left-[68px] not-italic text-[#765849] text-[11px] top-[188px] tracking-[0.11px] whitespace-nowrap" data-node-id="1:539">
        {zones?(zones.find(z=>z.id==='zone-1')?.desc ? '('+zones.find(z=>z.id==='zone-1')?.desc+')' : ''):'(섬유 한복)'}
      </p>
      <p className="[word-break:break-word] absolute font-sans font-medium leading-[15px] left-[253px] not-italic text-[#765849] text-[11px] top-[210px] tracking-[0.11px] whitespace-nowrap" data-node-id="1:540">
        {zones?(zones.find(z=>z.id==='zone-2')?.desc ? '('+zones.find(z=>z.id==='zone-2')?.desc+')' : ''):'(먹거리 타운)'}
      </p>
      <p className="[word-break:break-word] absolute font-sans leading-[15px] left-[251px] not-italic text-[#765849] text-[11px] top-[531px] tracking-[0.11px] whitespace-nowrap" data-node-id="1:541">
        {zones?(zones.find(z=>z.id==='zone-night')?.desc ? '('+zones.find(z=>z.id==='zone-night')?.desc+')' : ''):'(야간 먹거리)'}
      </p>
    </div>
  );
}
