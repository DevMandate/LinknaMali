import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import './carousel.css';
const ImageCarousel = ({images}) => {
  return (
    <Swiper
      modules={[Pagination, Navigation, Autoplay]}
      navigation
      autoplay={{ delay: 7000, disableOnInteraction: false }}
      spaceBetween={1}
      slidesPerView={2}
      pagination={{ type: 'progressbar' }}
      breakpoints={{
        250: { slidesPerView: 1 },
        768: { slidesPerView: 2 },
      }}
      className='m-0 rounded-[10px] shadow-[0_4px_6px_rgba(0,0,0,0.1)]'
    >
      {images.map((image, index) => (
      <SwiperSlide key={index} className='h-[400px]'>
        <img src={image} className='h-[100%] w-[100%]' style={{objectFit:'cover'}}  alt="Property" />
      </SwiperSlide> ))}
    </Swiper>
  );
};

export default ImageCarousel;
