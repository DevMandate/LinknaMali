import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import './css/carousel.css';

const ImageCarousel = ({ media = [], height = '400' }) => {
  console.log("🌀 Swiper media received in carousel.jsx:", media);

  const isSingleMedia = media.length === 1;

  return (
    <Swiper
      modules={[Pagination, Navigation, Autoplay]}
      navigation
      autoplay={{ delay: 7000, disableOnInteraction: false }}
      spaceBetween={1}
      slidesPerView={isSingleMedia ? 1 : 2}
      pagination={{ type: 'progressbar' }}
      breakpoints={{
        250: { slidesPerView: 1 },
        768: { slidesPerView: isSingleMedia ? 1 : 2 },
      }}
      className='m-0 rounded-[10px] shadow-[0_4px_6px_rgba(0,0,0,0.1)]'
    >
      {media.map((item, index) => (
        <SwiperSlide
          key={index}
          style={{
            height: `${height}px`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#000'
          }}
        >
          {item.type === 'video' ? (
            <video
              src={item.src}
              controls
              style={{
                height: '100%',
                objectFit: 'contain'
              }}
            />
          ) : (
            <img
              src={item.src}
              className='h-[100%] w-[100%]'
              style={{ objectFit: 'cover' }}
              alt='Property Media'
            />
          )}
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default ImageCarousel;
