import PropTypes from 'prop-types';
import CartItem from './CartItem';

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

interface CartProps {
  cart: CartItemType[];
  products: Product[];
  totalItems: number;
  totalPrice: number;
  discountedTotal: number;
  discountPercent: number;
  couponCode: string;
  onCouponChange: (code: string) => void;
  onApplyCoupon: () => void;
  onClearCoupon: () => void;
  onRemoveFromCart: (product: Product) => void;
  onDeleteItem: (product: Product) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onPayment: () => void;
  couponMessage: string;
  isDropdown?: boolean;
  hideCheckoutButton?: boolean;
}

function Cart({ cart, products, totalItems, totalPrice, discountedTotal, discountPercent, couponCode, onCouponChange, onApplyCoupon, onClearCoupon, onRemoveFromCart, onDeleteItem, onAddToCart, onPayment, couponMessage, isDropdown = false, hideCheckoutButton = false }: CartProps) {
  return (
    <div className={`${isDropdown ? 'bg-amber-50/95 dark:bg-slate-800 p-4 rounded-2xl shadow-2xl border border-amber-200 dark:border-slate-700' : 'bg-amber-50/95 dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-amber-200 dark:border-slate-700 mb-6'}`}>
      <h2 className={`${isDropdown ? 'text-xl' : 'text-2xl'} font-bold mb-4 text-sky-900 dark:text-slate-100`}>
        Kosár 🛒 ({totalItems} db)
      </h2>

      <div className="mb-4 p-4 bg-amber-100/70 dark:bg-slate-700 rounded-xl border border-amber-200 dark:border-slate-600">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kuponkód</label>
        <div className="mt-2 flex gap-2">
          <input
            value={couponCode}
            onChange={(e) => onCouponChange(e.target.value)}
            placeholder="Pl. SAVE10, FREESHIP"
            className="flex-1 px-3 py-2 border border-amber-200 dark:border-slate-600 rounded-lg bg-amber-50 dark:bg-slate-800 text-gray-900 dark:text-white"
          />
          <button
            onClick={onApplyCoupon}
            className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition"
          >
            Érvényesít
          </button>
          <button
            onClick={onClearCoupon}
            className="px-4 py-2 bg-gray-300 dark:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 transition"
          >
            Törlés
          </button>
        </div>
        {couponMessage && <p className="mt-2 text-sm text-orange-600 dark:text-orange-300">{couponMessage}</p>}
      </div>

      <div className="text-lg font-semibold text-amber-800 dark:text-sky-200">Összesen: {totalPrice.toLocaleString()} Ft</div>
      <div className="text-xl font-bold text-amber-700 dark:text-sky-300 mb-4">Fizetendő: {discountedTotal.toLocaleString()} Ft ({Math.round(discountPercent * 100)}% kedvezmény)</div>

      {cart.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-gray-500 dark:text-gray-400 text-lg">A kosár üres</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Válassz ki néhány terméket!</p>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {cart.map(item => {
              const product = products.find(p => p.id === item.id);
              return (
                <CartItem
                  key={item.id}
                  item={item}
                  product={product}
                  onRemoveFromCart={onRemoveFromCart}
                  onDeleteItem={onDeleteItem}
                  onAddToCart={onAddToCart}
                />
              );
            })}
          </div>
          
          {!hideCheckoutButton && (
            <button
              onClick={onPayment}
              className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {isDropdown ? `Tovább a kosárba (${discountedTotal.toLocaleString()} Ft)` : `💳 Fizetés (${discountedTotal.toLocaleString()} Ft)`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

Cart.propTypes = {
  cart: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      quantity: PropTypes.number.isRequired,
    })
  ).isRequired,
  products: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      price: PropTypes.number.isRequired,
    })
  ).isRequired,
  totalItems: PropTypes.number.isRequired,
  totalPrice: PropTypes.number.isRequired,
  discountedTotal: PropTypes.number.isRequired,
  discountPercent: PropTypes.number.isRequired,
  couponCode: PropTypes.string.isRequired,
  onCouponChange: PropTypes.func.isRequired,
  onApplyCoupon: PropTypes.func.isRequired,
  onClearCoupon: PropTypes.func.isRequired,
  onRemoveFromCart: PropTypes.func.isRequired,
  onDeleteItem: PropTypes.func.isRequired,
  onAddToCart: PropTypes.func.isRequired,
  onPayment: PropTypes.func.isRequired,
  couponMessage: PropTypes.string.isRequired,
  isDropdown: PropTypes.bool,
  hideCheckoutButton: PropTypes.bool,
};

export default Cart;