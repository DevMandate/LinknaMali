import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, Autoplay } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import './carousel.css'; // Optional: your custom styles

const MediaCarousel = ({ media }) => {
  if (!media || media.length === 0) {
    return (
      <div className="carousel-no-media">
        <p>No media available</p>
      </div>
    );
  }

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
      {media.map((item, index) => (
        <SwiperSlide
          key={index}
          className='h-[400px] flex justify-center items-center bg-black'
        >
          {item.type === 'video' ? (
            <video
              src={item.src}
              controls
              className='h-[100%] w-[100%]'
              style={{ objectFit: 'contain' }}
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <img
              src={item.src}
              className='h-[100%] w-[100%]'
              style={{ objectFit: 'cover' }}
              alt="Property media"
              onError={(e) => {
                e.target.src = "/default-placeholder.jpg";
              }}
            />
          )}
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default MediaCarousel;
