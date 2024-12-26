import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const ImageCarousel = ({images}) => {
  return (
    <Swiper
      modules={[Pagination, Navigation, Autoplay]}
      navigation
      autoplay={{ delay: 7000, disableOnInteraction: false }}
      spaceBetween={20}
      slidesPerView={2}
      pagination={{ type: 'progressbar' }}
      breakpoints={{
        640: { slidesPerView: 1 },
        768: { slidesPerView: 2 },
      }}
      style={{maxWidth: '70vw'}}
      className=''
    >
      {images.map((image, index) => (
      <SwiperSlide key={index} className='h-[500px]'>
        <img src={image} className='h-[100%] w-[100%]' style={{objectFit:'cover'}}  alt="Property" />
      </SwiperSlide> ))}
    </Swiper>
  );
};

export default ImageCarousel;
