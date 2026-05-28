import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import hotel1 from '@/assets/hotel-1.jpg';
import hotel2 from '@/assets/hotel-2.jpg';
import hotel3 from '@/assets/hotel-3.jpg';
import hotel4 from '@/assets/hotel-4.jpg';
import hotel5 from '@/assets/hotel-5.jpg';

const slides = [
  { image: hotel1, label: 'Elegant Lobby'       },
  { image: hotel2, label: 'Luxurious Rooms'     },
  { image: hotel3, label: 'Rooftop Pool'        },
  { image: hotel4, label: 'Fine Dining'         },
  { image: hotel5, label: 'Stunning City Views' },
];

interface HotelSlideshowProps {
  interval?: number;
  showLabel?: boolean;
  className?: string;
  overlay?: boolean;
}

export function HotelSlideshow({
  interval = 2000,
  showLabel = true,
  className = '',
  overlay = true,
}: HotelSlideshowProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, interval);
    return () => clearInterval(timer);
  }, [interval]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1   }}
          exit={{    opacity: 0, scale: 0.96 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <img
            src={slides[current].image}
            alt={slides[current].label}
            className="w-full h-full object-cover"
          />
          {overlay && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          )}
        </motion.div>
      </AnimatePresence>

      {showLabel && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`label-${current}`}
            initial={{ opacity: 0, y: 16  }}
            animate={{ opacity: 1, y: 0   }}
            exit={{    opacity: 0, y: -16 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="absolute bottom-6 left-6 z-10"
          >
            <p className="text-white text-sm font-medium tracking-wide drop-shadow">
              ✦ {slides[current].label}
            </p>
          </motion.div>
        </AnimatePresence>
      )}

      <div className="absolute bottom-6 right-6 z-10 flex gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? 'w-6 h-2 bg-white'
                : 'w-2 h-2 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
}