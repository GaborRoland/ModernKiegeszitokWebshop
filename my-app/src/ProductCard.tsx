import PropTypes from 'prop-types';
import { useState, type MouseEvent } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
  images?: string[];
  rating?: number;
  reviews?: { user: string; comment: string; rating: number }[];
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity?: number) => void;
  onOpenDetails: () => void;
  isInCart: boolean;
  isAnimating: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isInCompare: boolean;
  onToggleCompare: () => void;
}

function ProductCard({ product, onAddToCart, onOpenDetails, isInCart, isAnimating, isFavorite, onToggleFavorite, isInCompare, onToggleCompare }: ProductCardProps) {
  const images = product.images && product.images.length > 0 ? product.images : [product.image];
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const fallbackImage = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop stop-color='#2563eb'/><stop offset='1' stop-color='#7c3aed'/></linearGradient></defs><rect width='1200' height='800' fill='url(#g)'/><circle cx='1020' cy='120' r='180' fill='rgba(255,255,255,.12)'/><circle cx='180' cy='690' r='220' fill='rgba(255,255,255,.12)'/><text x='50%' y='48%' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Segoe UI, Arial, sans-serif' font-size='58' font-weight='700'>${(product.name || 'Termek').slice(0, 22)}</text><text x='50%' y='58%' dominant-baseline='middle' text-anchor='middle' fill='rgba(255,255,255,.92)' font-family='Segoe UI, Arial, sans-serif' font-size='28'>Nincs feltoltott kep</text></svg>`
  )}`;

  function handleCardClick(e: MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    if (target.closest('button, input, textarea, select, summary, a, label')) {
      return;
    }
    onOpenDetails();
  }

  return (
    <div
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDetails();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${product.name} részletek megnyitása`}
      className={`bg-amber-50/90 dark:bg-slate-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-amber-200 dark:border-slate-700 ${
        isAnimating ? 'scale-105 shadow-2xl' : ''
      } hover:-translate-y-1 cursor-pointer`}
    >
      <div className="relative">
        <img
          src={images[activeImageIndex]}
          alt={`${product.name} kép ${activeImageIndex + 1}`}
          className="w-full h-48 object-cover rounded-xl mb-4 shadow-md"
          loading="lazy"
          onError={(e) => {
            const target = e.currentTarget;
            target.onerror = null;
            target.src = fallbackImage;
          }}
        />

        <div className="absolute inset-x-0 bottom-2 flex justify-center gap-2">
          {images.map((img, idx) => (
            <button
              key={`${product.id}-thumb-${idx}`}
              onClick={() => setActiveImageIndex(idx)}
              className={`w-8 h-8 rounded-full border border-white/80 ${
                activeImageIndex === idx ? 'ring-2 ring-teal-400' : 'opacity-60'
              }`}>
              <img
                src={img}
                alt="Kép mini"
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.onerror = null;
                  target.src = fallbackImage;
                }}
              />
            </button>
          ))}
        </div>

        <button
          onClick={onToggleFavorite}
          className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all duration-200 shadow-lg ${
            isFavorite
                ? 'bg-amber-50/90 dark:bg-slate-700/90 text-rose-500 hover:text-rose-600 backdrop-blur-sm'
                : 'bg-amber-50/90 dark:bg-slate-700/90 text-gray-600 hover:text-rose-500 backdrop-blur-sm'
          }`}
          title={isFavorite ? 'Eltávolítás a kedvencekből' : 'Hozzáadás a kedvencekhez'}
        >
          <span className="text-2xl leading-none">{isFavorite ? '♥' : '♡'}</span>
        </button>

        <button
          onClick={onToggleCompare}
          className={`absolute top-3 left-3 w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all duration-200 shadow-lg ${
            isInCompare
                ? 'bg-teal-500 text-white hover:bg-teal-600'
                : 'bg-amber-50/90 dark:bg-slate-700/90 text-gray-600 hover:text-teal-500 backdrop-blur-sm'
          }`}
          title={isInCompare ? 'Eltávolítás az összehasonlításból' : 'Hozzáadás az összehasonlításhoz'}
        >
          {isInCompare ? '🔎' : '📝'}
        </button>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2">
          {product.name}
        </h2>

        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div className="flex flex-col gap-2">
            <p className="text-2xl font-bold text-amber-800 dark:text-sky-200 tracking-tight whitespace-nowrap">
              {product.price.toLocaleString()} Ft
            </p>

            <div className="flex items-center rounded-xl overflow-hidden border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-800 shadow-sm w-fit">
              <button
                type="button"
                onClick={() => setSelectedQuantity((prev) => Math.max(1, prev - 1))}
                className="w-9 h-9 flex items-center justify-center bg-gradient-to-b from-white to-orange-50 dark:from-slate-700 dark:to-slate-800 text-gray-700 dark:text-gray-200 hover:from-orange-50 hover:to-orange-100 dark:hover:from-slate-600 dark:hover:to-slate-700 transition-all duration-200"
                aria-label={`${product.name} darabszám csökkentése`}
                title="Csökkentés"
              >
                <span className="text-base font-bold leading-none">-</span>
              </button>

              <div
                className="w-11 h-9 flex items-center justify-center bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-slate-800 dark:to-slate-700 text-gray-900 dark:text-white text-base font-semibold antialiased tabular-nums [font-variant-numeric:tabular-nums]"
                aria-label={`${product.name} kiválasztott darabszám: ${selectedQuantity}`}
              >
                {selectedQuantity}
              </div>

              <button
                type="button"
                onClick={() => setSelectedQuantity((prev) => Math.min(99, prev + 1))}
                className="w-9 h-9 flex items-center justify-center bg-gradient-to-b from-white to-teal-50 dark:from-slate-700 dark:to-slate-800 text-gray-700 dark:text-gray-200 hover:from-teal-50 hover:to-teal-100 dark:hover:from-slate-600 dark:hover:to-slate-700 transition-all duration-200"
                aria-label={`${product.name} darabszám növelése`}
                title="Növelés"
              >
                <span className="text-base font-bold leading-none">+</span>
              </button>
            </div>
          </div>

          <button
            onClick={() => onAddToCart(product, selectedQuantity)}
            className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg ${
              isInCart
                ? 'bg-amber-400 text-amber-950 dark:bg-sky-600 dark:text-white hover:bg-amber-500 dark:hover:bg-sky-700'
                : 'bg-amber-300 text-amber-950 dark:bg-sky-700 dark:text-white hover:bg-amber-400 dark:hover:bg-sky-800'
            }`}
          >
            {isInCart ? 'Hozzáad' : 'Kosárba'}
          </button>
        </div>

      </div>
    </div>
  );
}

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    description: PropTypes.string,
    image: PropTypes.string,
    images: PropTypes.arrayOf(PropTypes.string),
    rating: PropTypes.number,
    reviews: PropTypes.arrayOf(
      PropTypes.shape({
        user: PropTypes.string.isRequired,
        comment: PropTypes.string.isRequired,
        rating: PropTypes.number.isRequired,
      })
    ),
  }).isRequired,
  onAddToCart: PropTypes.func.isRequired,
  onOpenDetails: PropTypes.func.isRequired,
  isInCart: PropTypes.bool.isRequired,
  isAnimating: PropTypes.bool.isRequired,
  isFavorite: PropTypes.bool.isRequired,
  onToggleFavorite: PropTypes.func.isRequired,
  isInCompare: PropTypes.bool.isRequired,
  onToggleCompare: PropTypes.func.isRequired,
};

export default ProductCard;