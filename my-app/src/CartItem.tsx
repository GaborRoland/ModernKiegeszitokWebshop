import PropTypes from 'prop-types';

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
}

interface CartItemType {
  id: number;
  quantity: number;
}

interface CartItemProps {
  item: CartItemType;
  product: Product | undefined;
  onRemoveFromCart: (product: Product) => void;
  onDeleteItem: (product: Product) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
}

function CartItem({ item, product, onRemoveFromCart, onDeleteItem, onAddToCart }: CartItemProps) {
  const itemTotal = (product?.price || 0) * item.quantity;

  return (
    <div className="flex items-center gap-4 p-4 bg-amber-100/70 dark:bg-slate-700 rounded-xl border border-amber-200 dark:border-slate-600">
      <img
        src={product?.image}
        alt={product?.name}
        className="w-16 h-16 object-cover rounded-lg shadow-sm"
        loading="lazy"
        onError={(e) => {
          e.target.src = 'https://via.placeholder.com/64x64?text=No+Image';
        }}
      />

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
          {product?.name}
        </h3>
        <p className="text-sm text-amber-700 dark:text-sky-300">
          {product?.price.toLocaleString()} Ft / db
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-xl overflow-hidden border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-800 shadow-sm">
          <button
            onClick={() => {
              if (!product) return;
              onRemoveFromCart(product);
            }}
            className="w-8 h-8 flex items-center justify-center bg-gradient-to-b from-white to-orange-50 dark:from-slate-700 dark:to-slate-800 text-gray-700 dark:text-gray-200 hover:from-orange-50 hover:to-orange-100 dark:hover:from-slate-600 dark:hover:to-slate-700 transition-all duration-200"
            title="Darabszám csökkentése"
            aria-label={`${product?.name || 'Termék'} darabszám csökkentése`}
          >
            <span className="text-sm font-bold leading-none">-</span>
          </button>

          <span className="w-9 h-8 flex items-center justify-center bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-slate-800 dark:to-slate-700 text-gray-900 dark:text-white text-base font-semibold antialiased tabular-nums [font-variant-numeric:tabular-nums]">
            {item.quantity}
          </span>

          <button
            onClick={() => {
              if (!product) return;
              onAddToCart(product);
            }}
            className="w-8 h-8 flex items-center justify-center bg-gradient-to-b from-white to-teal-50 dark:from-slate-700 dark:to-slate-800 text-gray-700 dark:text-gray-200 hover:from-teal-50 hover:to-teal-100 dark:hover:from-slate-600 dark:hover:to-slate-700 transition-all duration-200"
            title="Darabszám növelése"
            aria-label={`${product?.name || 'Termék'} darabszám növelése`}
          >
            <span className="text-sm font-bold leading-none">+</span>
          </button>
        </div>

        <button
          onClick={() => {
            if (!product) return;
            onDeleteItem(product);
          }}
          className="px-3 h-8 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors"
          title="Termék törlése a kosárból"
          aria-label={`${product?.name || 'Termék'} teljes törlése a kosárból`}
        >
          Törlés
        </button>
      </div>

      <div className="text-right">
        <p className="font-bold text-amber-800 dark:text-sky-200">
          {itemTotal.toLocaleString()} Ft
        </p>
      </div>
    </div>
  );
}

CartItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.number.isRequired,
    quantity: PropTypes.number.isRequired,
  }).isRequired,
  product: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
  }),
  onRemoveFromCart: PropTypes.func.isRequired,
  onDeleteItem: PropTypes.func.isRequired,
  onAddToCart: PropTypes.func.isRequired,
};

export default CartItem;