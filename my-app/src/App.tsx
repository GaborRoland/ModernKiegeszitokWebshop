import { useState, useEffect, useRef, useMemo, type FormEvent } from "react";
import ProductCard from "./ProductCard";
import Cart from "./Cart";
import ProductSkeleton from "./ProductSkeleton";
import { apiService } from "./apiService";
import { useTheme } from "./ThemeContext";
import FilterSidebar, { FilterState, COLORS } from "./FilterSidebar";

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
  images?: string[];
  rating?: number;
  reviews?: { user: string; comment: string; rating: number }[];
  inStock?: boolean;
  category?: string;
  colors?: string[];
}

// Kategória leképezés terméknév alapján
function getCategory(name: string): string {
  const n = name.toLowerCase();
  if (/laptop|notebook|monitor|billentyűzet|keyboard|\begér\b|mouse|\bssd\b|\bhub\b|webkamera|webcam|hűtő|scanner|szkenner/.test(n)) return 'Számítógép';
  if (/fülhallgató|headphone|mikrofon|microphone|bluetooth.*besz|besz.*bluetooth|speaker/.test(n)) return 'Audio';
  if (/okos óra|smartwatch|watch/.test(n)) return 'Viselhető';
  if (/töltő|powerbank|kábel|cable|hátizsák|backpack|egér pad|mousepad/.test(n)) return 'Kiegészítő';
  if (/izzó|lámpa|lamp/.test(n)) return 'Okosotthon';
  if (/masszírozó|massage/.test(n)) return 'Wellness';
  return 'Egyéb';
}

// Szín leképezés terméknév alapján
const COLOR_MAP: Record<string, string[]> = {
  'Fekete': ['laptop', 'billentyűzet', 'fülhallgató', 'gaming', 'monitor', 'webkamera', 'mikrofon', 'bluetooth', 'hub', 'masszírozó', 'egér pad', 'hátizsák'],
  'Fehér': ['led', 'izzó', 'scanner', 'document', 'lámpa'],
  'Szürke': ['egér pad', 'hűtő', 'ssd', 'töltő', 'powerbank', 'hub', 'bluetooth'],
  'Ezüst': ['kábel', 'okos óra', 'mikrofon'],
  'Kék': ['bluetooth', 'speak'],
  'Zöld': ['hátizsák'],
};

function getColors(name: string): string[] {
  const n = name.toLowerCase();
  return COLORS.map(c => c.name).filter(color =>
    (COLOR_MAP[color] || []).some(k => n.includes(k))
  );
}

interface CartItem {
  id: number;
  quantity: number;
}

interface User {
  name: string;
  loginTime: string;
}

function getProductIdFromUrl(): number | null {
  const value = new URLSearchParams(window.location.search).get('product');
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getIsCartFromUrl(): boolean {
  return new URLSearchParams(window.location.search).get('cart') === '1';
}

function getIsProductsFromUrl(): boolean {
  return new URLSearchParams(window.location.search).get('products') === '1';
}

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (password.length === 0) {
    return { label: 'Nincs megadva', color: 'bg-slate-300', textColor: 'text-slate-600', widthClass: 'w-0' };
  }
  if (score <= 2) {
    return { label: 'Gyenge', color: 'bg-red-500', textColor: 'text-red-700', widthClass: 'w-1/3' };
  }
  if (score <= 4) {
    return { label: 'Közepes', color: 'bg-amber-500', textColor: 'text-amber-700', widthClass: 'w-2/3' };
  }

  return { label: 'Erős', color: 'bg-emerald-500', textColor: 'text-emerald-700', widthClass: 'w-full' };
}

function App() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('webshop-cart');
    console.log('Kezdeti betöltés localStorage-ból:', saved);
    return saved ? JSON.parse(saved) : [];
  });
  const [animatingProduct, setAnimatingProduct] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('webshop-user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [showLogin, setShowLogin] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showPrimaryPassword, setShowPrimaryPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authPasswordDraft, setAuthPasswordDraft] = useState('');
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [showCartPage, setShowCartPage] = useState<boolean>(() => getIsCartFromUrl());
  const [showProductsPage, setShowProductsPage] = useState<boolean>(() => getIsProductsFromUrl());
  const [selectedProductId, setSelectedProductId] = useState<number | null>(() => getProductIdFromUrl());
  const [detailQuantity, setDetailQuantity] = useState(1);
  const [filterState, setFilterState] = useState<FilterState>({
    priceMin: 0,
    priceMax: 999999,
    categories: [],
    colors: [],
    inStockOnly: false,
    sortBy: 'name',
  });
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<number[]>(() => {
    const saved = localStorage.getItem('webshop-favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [compareSelection, setCompareSelection] = useState<number[]>(() => {
    const saved = localStorage.getItem('webshop-compare');
    return saved ? JSON.parse(saved) : [];
  });
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [orderHistory, setOrderHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem('webshop-orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [itemsPerPage] = useState(6);
  const [currentPage, setCurrentPage] = useState(1);
  const cartDropdownRef = useRef<HTMLDivElement | null>(null);
  const userDropdownRef = useRef<HTMLDivElement | null>(null);

  const createFallbackImage = (label: string) => {
    const safeLabel = (label || 'Termek').slice(0, 24);
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop stop-color='#2563eb'/><stop offset='1' stop-color='#7c3aed'/></linearGradient></defs><rect width='1200' height='800' fill='url(#g)'/><circle cx='1020' cy='120' r='180' fill='rgba(255,255,255,.12)'/><circle cx='180' cy='690' r='220' fill='rgba(255,255,255,.12)'/><text x='50%' y='48%' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Segoe UI, Arial, sans-serif' font-size='58' font-weight='700'>${safeLabel}</text><text x='50%' y='58%' dominant-baseline='middle' text-anchor='middle' fill='rgba(255,255,255,.92)' font-family='Segoe UI, Arial, sans-serif' font-size='28'>Nincs feltoltott kep</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const resolveImageUrl = (rawValue: unknown, fallbackLabel: string) => {
    if (typeof rawValue !== 'string' || rawValue.trim().length === 0) {
      return createFallbackImage(fallbackLabel);
    }

    const value = rawValue.trim();
    if (/^(https?:|data:|blob:)/i.test(value)) {
      return value;
    }

    if (value.startsWith('/')) {
      return value;
    }

    // Ha csak fajlnev jon az API-tol (pl. laptop.jpg), akkor a /public/products alatt keressuk.
    const baseName = value.replace(/\\/g, '/').split('/').pop() || value;
    const stem = baseName.replace(/\.[^.]+$/, '');
    return `/products/${stem}.svg`;
  };

  const normalizeProduct = (product: any): Product => {
    let imageList: string[] = [];

    if (Array.isArray(product.images)) {
      imageList = product.images
        .filter((img: unknown) => typeof img === 'string' && img.trim().length > 0)
        .map((img: string) => resolveImageUrl(img, product.name));
    } else if (typeof product.images === 'string' && product.images.trim().length > 0) {
      try {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed)) {
          imageList = parsed
            .filter((img: unknown) => typeof img === 'string' && img.trim().length > 0)
            .map((img: string) => resolveImageUrl(img, product.name));
        } else {
          imageList = [resolveImageUrl(product.images, product.name)];
        }
      } catch {
        imageList = [resolveImageUrl(product.images, product.name)];
      }
    }

    if (imageList.length === 0 && typeof product.image === 'string' && product.image.trim().length > 0) {
      imageList = [resolveImageUrl(product.image, product.name)];
    }

    if (imageList.length === 0) {
      imageList = [createFallbackImage(product.name)];
    }

    const safeReviews = Array.isArray(product.reviews)
      ? product.reviews
      : [
          { user: 'Anna', comment: 'Kiváló termék, gyors szállítás!', rating: 5 },
          { user: 'Bence', comment: 'Nagyon jó minőség, ajánlom.', rating: 4 },
        ];

    return {
      ...product,
      image: imageList[0],
      images: imageList,
      rating: typeof product.rating === 'number' ? product.rating : parseFloat((Math.random() * 2 + 3).toFixed(1)),
      reviews: safeReviews,
      inStock: product.id % 5 !== 0,
      category: getCategory(product.name || ''),
      colors: getColors(product.name || ''),
    };
  };

  // Adatok betöltése induláskor
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Termékek betöltése API-ból
        console.log('Termékek betöltése API-ból...');
        const productsData = await apiService.getProducts();
        console.log('Betöltött termékek:', productsData);

        const normalizedProducts: Product[] = productsData.map(normalizeProduct);

        // Ár tartomány inicializálása
        if (normalizedProducts.length > 0) {
          const minP = Math.min(...normalizedProducts.map(p => p.price));
          const maxP = Math.max(...normalizedProducts.map(p => p.price));
          setFilterState(prev => ({ ...prev, priceMin: minP, priceMax: maxP }));
        }

        // localStorage-ból betöltött értékelések felülírása
        const savedReviews = localStorage.getItem('webshop-products-reviews');
        let finalProducts = normalizedProducts;

        if (savedReviews) {
          try {
            const parsedSaved = JSON.parse(savedReviews);
            if (Array.isArray(parsedSaved)) {
              finalProducts = parsedSaved.map(normalizeProduct);
            }
          } catch (storageError) {
            console.warn('Hibás localStorage értékelések, normalizált API adat használata:', storageError);
          }
        }

        setProducts(finalProducts);

        // Kosár már betöltve a useState kezdeti értékében
      } catch (err) {
        console.error('Hiba az adatok betöltésekor:', err);
        setError('Nem sikerült betölteni az adatokat. Próbáld újra később.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Kosár mentése localStorage-ba változáskor
  useEffect(() => {
    console.log('Kosár változott, mentés localStorage-ba:', cart);
    try {
      localStorage.setItem('webshop-cart', JSON.stringify(cart));
      console.log('Sikeres mentés localStorage-ba');
    } catch (err) {
      console.error('Hiba a localStorage mentésekor:', err);
    }
  }, [cart]);

  // Kedvencek mentése localStorage-ba változáskor
  useEffect(() => {
    localStorage.setItem('webshop-favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Összehasonlítási lista mentése
  useEffect(() => {
    localStorage.setItem('webshop-compare', JSON.stringify(compareSelection));
  }, [compareSelection]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
        setCurrentPage(prev => prev + 1);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (showCartDropdown && cartDropdownRef.current && !cartDropdownRef.current.contains(target)) {
        setShowCartDropdown(false);
      }

      if (showUserDropdown && userDropdownRef.current && !userDropdownRef.current.contains(target)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCartDropdown, showUserDropdown]);

  useEffect(() => {
    if (!showLogin) return;

    const handleEscapeClose = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeAuthModal();
      }
    };

    document.addEventListener('keydown', handleEscapeClose);
    return () => document.removeEventListener('keydown', handleEscapeClose);
  }, [showLogin]);

  useEffect(() => {
    setShowPrimaryPassword(false);
    setShowConfirmPassword(false);
    setAuthPasswordDraft('');
  }, [showLogin, isRegisterMode, isForgotPasswordMode]);

  function addToCart(product: Product, quantity: number = 1) {
    const safeQuantity = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1;
    console.log('Termék hozzáadása:', product.name, 'Mennyiség:', safeQuantity);

    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);

      if (!existing) {
        return [...prevCart, { id: product.id, quantity: safeQuantity }];
      }

      return prevCart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + safeQuantity }
          : item
      );
    });

    // Animáció indítása
    setAnimatingProduct(product.id);
    setTimeout(() => setAnimatingProduct(null), 500);
  }

  function removeFromCart(product: Product) {
    const existing = cart.find(item => item.id === product.id);

    if (existing && existing.quantity === 1) {
      setCart(cart.filter(item => item.id !== product.id));
    } else if (existing) {
      setCart(
        cart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
      );
    }
  }

  function deleteItemFromCart(product: Product) {
    setCart(prevCart => prevCart.filter(item => item.id !== product.id));
  }

  function isInCart(productId: number): boolean {
    return cart.some(item => item.id === productId);
  }

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = cart.reduce((total, item) => {
    const product = products.find(p => p.id === item.id);
    return total + (product?.price || 0) * item.quantity;
  }, 0);

  const discountedTotal = Math.round(totalPrice * (1 - discountPercent));

  // Abszolút ár minimum/maximum a betöltött termékekből
  const absoluteMin = useMemo(() => products.length ? Math.min(...products.map(p => p.price)) : 0, [products]);
  const absoluteMax = useMemo(() => products.length ? Math.max(...products.map(p => p.price)) : 999999, [products]);

  // Elérhető kategóriák a termékekből
  const availableCategories = useMemo(() => {
    const cats = new Set(products.map(p => p.category || 'Egyéb'));
    return Array.from(cats).sort();
  }, [products]);

  // Szűrt és rendezett termékek
  const filteredAndSortedProducts = useMemo(() => products
    .filter(product => {
      if (showFavoritesOnly && !favorites.includes(product.id)) return false;
      if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !product.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (product.price < filterState.priceMin || product.price > filterState.priceMax) return false;
      if (filterState.categories.length > 0 && !filterState.categories.includes(product.category || 'Egyéb')) return false;
      if (filterState.colors.length > 0 && !filterState.colors.some(c => (product.colors || []).includes(c))) return false;
      if (filterState.inStockOnly && !product.inStock) return false;
      return true;
    })
    .sort((a, b) => {
      switch (filterState.sortBy) {
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'rating': return (b.rating ?? 0) - (a.rating ?? 0);
        case 'name': default: return a.name.localeCompare(b.name);
      }
    }), [products, searchTerm, filterState, showFavoritesOnly, favorites]);

  const weeklyDeals = useMemo(() => {
    const discountRates = [0.12, 0.18, 0.22, 0.15];
    return filteredAndSortedProducts.slice(0, 4).map((product, index) => {
      const discountRate = discountRates[index % discountRates.length];
      return {
        ...product,
        discountRate,
        discountedPrice: Math.round(product.price * (1 - discountRate)),
      };
    });
  }, [filteredAndSortedProducts]);

  const recommendedProducts = useMemo(() => {
    return [...filteredAndSortedProducts]
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 4);
  }, [filteredAndSortedProducts]);

  const isHomeView = !showCartPage && !showProductsPage && selectedProductId === null;
  const isProductsView = !showCartPage && (showProductsPage || selectedProductId !== null);
  const authPasswordStrength = getPasswordStrength(authPasswordDraft);

  // Paginált termékek (infinite scroll)
  const paginatedProducts = filteredAndSortedProducts.slice(0, currentPage * itemsPerPage);
  const selectedProduct = products.find(p => p.id === selectedProductId) ?? null;

  useEffect(() => {
    const handlePopState = () => {
      setSelectedProductId(getProductIdFromUrl());
      setShowCartPage(getIsCartFromUrl());
      setShowProductsPage(getIsProductsFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function openProductDetails(productId: number) {
    const url = new URL(window.location.href);
    url.searchParams.set('product', String(productId));
    url.searchParams.delete('cart');
    window.history.pushState({}, '', url);
    setSelectedProductId(productId);
    setShowCartPage(false);
    setDetailQuantity(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeProductDetails() {
    const url = new URL(window.location.href);
    url.searchParams.delete('product');
    window.history.pushState({}, '', url);
    setSelectedProductId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openCartPage() {
    const url = new URL(window.location.href);
    url.searchParams.set('cart', '1');
    url.searchParams.delete('product');
    url.searchParams.delete('products');
    window.history.pushState({}, '', url);
    setShowCartDropdown(false);
    setSelectedProductId(null);
    setShowCartPage(true);
    setShowProductsPage(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeCartPage() {
    const url = new URL(window.location.href);
    url.searchParams.delete('cart');
    window.history.pushState({}, '', url);
    setShowCartPage(false);
  }

  function openProductsPage() {
    const url = new URL(window.location.href);
    url.searchParams.set('products', '1');
    url.searchParams.delete('cart');
    url.searchParams.delete('product');
    window.history.pushState({}, '', url);
    setShowProductsPage(true);
    setShowCartPage(false);
    setSelectedProductId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeAuthModal() {
    setShowLogin(false);
    setIsRegisterMode(false);
    setIsForgotPasswordMode(false);
    setAuthError('');
    setAuthSuccess('');
  }

  function goHome() {
    const url = new URL(window.location.href);
    url.searchParams.delete('cart');
    url.searchParams.delete('product');
    url.searchParams.delete('products');
    window.history.pushState({}, '', url);
    setSelectedProductId(null);
    setShowCartPage(false);
    setShowProductsPage(false);
    setShowCartDropdown(false);
    setShowFiltersMobile(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Login függvény
  function login(username: string) {
    const userData: User = { name: username, loginTime: new Date().toISOString() };
    setUser(userData);
    localStorage.setItem('webshop-user', JSON.stringify(userData));
    setAuthError('');
    setAuthSuccess('');
    setShowLogin(false);
  }

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    if (!email || !password) {
      setAuthError('E-mail és jelszó megadása kötelező.');
      return;
    }

    try {
      setIsAuthLoading(true);
      const response = await apiService.login(email, password);
      const displayName = typeof response?.user?.username === 'string' && response.user.username.trim().length > 0
        ? response.user.username.trim()
        : email.split('@')[0] || 'Felhasználó';
      login(displayName);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bejelentkezés sikertelen';
      setAuthError(message);
    } finally {
      setIsAuthLoading(false);
    }
  }

  async function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get('username') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const passwordConfirm = String(formData.get('passwordConfirm') ?? '');

    if (!username || !email || !password || !passwordConfirm) {
      setAuthError('Minden mező kitöltése kötelező.');
      return;
    }

    if (password.length < 6) {
      setAuthError('A jelszónak legalább 6 karakter hosszúnak kell lennie.');
      return;
    }

    if (password !== passwordConfirm) {
      setAuthError('A két jelszó nem egyezik.');
      return;
    }

    try {
      setIsAuthLoading(true);
      const response = await apiService.register(username, email, password);
      const displayName = typeof response?.user?.username === 'string' && response.user.username.trim().length > 0
        ? response.user.username.trim()
        : username;
      setAuthSuccess('Sikeres regisztráció. Beléptetve.');
      login(displayName);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Regisztráció sikertelen';
      setAuthError(message);
    } finally {
      setIsAuthLoading(false);
    }
  }

  async function handleForgotPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();
    const newPassword = String(formData.get('newPassword') ?? '');
    const newPasswordConfirm = String(formData.get('newPasswordConfirm') ?? '');

    if (!email || !newPassword || !newPasswordConfirm) {
      setAuthError('Minden mező kitöltése kötelező.');
      return;
    }

    if (newPassword.length < 6) {
      setAuthError('Az új jelszónak legalább 6 karakter hosszúnak kell lennie.');
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setAuthError('A két új jelszó nem egyezik.');
      return;
    }

    try {
      setIsAuthLoading(true);
      await apiService.resetPassword(email, newPassword);
      setAuthSuccess('Jelszó sikeresen frissítve. Most már bejelentkezhetsz.');
      setIsForgotPasswordMode(false);
      setIsRegisterMode(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Jelszó visszaállítás sikertelen';
      setAuthError(message);
    } finally {
      setIsAuthLoading(false);
    }
  }

  // Logout függvény
  function logout() {
    setUser(null);
    apiService.logout();
    localStorage.removeItem('webshop-user');
  }

  // Kedvencek kezelése
  function toggleFavorite(productId: number) {
    setFavorites(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  }

  function isFavorite(productId: number): boolean {
    return favorites.includes(productId);
  }

  function isInCompare(productId: number): boolean {
    return compareSelection.includes(productId);
  }

  function toggleCompare(productId: number) {
    setCompareSelection(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  }

  function addReview(productId: number, review: { user: string; comment: string; rating: number }) {
    setProducts(prevProducts => {
      const updated = prevProducts.map(p =>
        p.id === productId
          ? { 
              ...p, 
              reviews: [review, ...(p.reviews ?? [])], 
              rating: Number((((p.reviews?.reduce((sum, r) => sum + r.rating, 0) ?? 0) + review.rating) / ((p.reviews?.length ?? 0) + 1)).toFixed(1)) 
            }
          : p
      );
      localStorage.setItem('webshop-products-reviews', JSON.stringify(updated));
      return updated;
    });
  }

  function applyCoupon() {
    const normalized = couponCode.trim().toUpperCase();
    if (normalized === 'SAVE10') {
      setDiscountPercent(0.10);
      setCouponMessage('Sikeresen érvényesítve: 10% kedvezmény.');
    } else if (normalized === 'FREESHIP') {
      setDiscountPercent(0.05);
      setCouponMessage('Sikeresen érvényesítve: 5% kedvezmény.');
    } else if (!normalized) {
      setCouponMessage('Kérlek, adj meg egy kuponkódot.');
    } else {
      setDiscountPercent(0);
      setCouponMessage('Érvénytelen kuponkód.');
    }
  }

  function clearCoupon() {
    setCouponCode('');
    setDiscountPercent(0);
    setCouponMessage('Kupon törölve.');
  }

  // Fizetés függvény (rendelés mentésével)
  function processPayment() {
    const finalPrice = Math.round(totalPrice * (1 - discountPercent));
    const order = {
      id: Date.now(),
      date: new Date().toISOString(),
      items: cart,
      totalPrice: finalPrice,
      originalTotal: totalPrice,
      discountPercent,
      couponCode: couponCode.trim().toUpperCase() || 'N/A',
      user: user?.name || 'Vendég'
    };

    setOrderHistory(prev => {
      const updated = [...prev, order];
      localStorage.setItem('webshop-orders', JSON.stringify(updated));
      return updated;
    });

    alert(`Sikeres fizetés! ${finalPrice.toLocaleString()} Ft kifizetve.`);
    setCart([]);
    setCouponCode('');
    setDiscountPercent(0);
    setCouponMessage('');
    closeCartPage();
  }

  // Betöltés állapot
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-100 via-amber-50 to-orange-50 dark:bg-none dark:bg-slate-950 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Hiba állapot
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-100 via-amber-50 to-orange-50 dark:bg-none dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center bg-amber-50 p-8 rounded-xl shadow border border-amber-200">
          <p className="text-red-600 mb-4">❌ {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Újra próbálkozás
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-amber-50 to-orange-50 dark:bg-none dark:bg-slate-950 transition-all duration-300" role="application" aria-label="Modern Kiegészítők Webshop">
      {/* Header */}
      <header className="bg-amber-50/95 dark:bg-slate-900/90 backdrop-blur-lg shadow-lg border-b border-amber-200 dark:border-sky-900/60 sticky top-0 z-40" role="banner">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={goHome}
              className="flex items-center space-x-3 text-left group"
              title="Vissza a főoldalra"
              aria-label="Vissza a főoldalra"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-sky-900 border border-amber-300 dark:border-sky-500/60 flex items-center justify-center shadow-sm overflow-hidden group-hover:scale-105 transition-transform">
                <img src={isDarkMode ? "/logos/mk-outline-sky.svg" : "/logos/mk-outline-amber.svg"} alt="Modern Kiegészítők logó" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-800 dark:group-hover:text-sky-300 transition-colors">
                  Modern Kiegészítők
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                  Letisztult választék • Gyors szállítás
                </p>
              </div>
            </button>

            <nav className="hidden md:flex items-center gap-2" aria-label="Fő navigáció">
              <button
                type="button"
                onClick={goHome}
                className={`px-4 py-2 rounded-xl font-semibold transition-colors ${isHomeView
                  ? 'bg-amber-300 text-amber-950 dark:bg-sky-700 dark:text-white'
                  : 'bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-sky-900/40 dark:text-sky-100 dark:hover:bg-sky-800/50'}`}
              >
                Főoldal
              </button>
              <button
                type="button"
                onClick={openProductsPage}
                className={`px-4 py-2 rounded-xl font-semibold transition-colors ${isProductsView
                  ? 'bg-amber-300 text-amber-950 dark:bg-sky-700 dark:text-white'
                  : 'bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-sky-900/40 dark:text-sky-100 dark:hover:bg-sky-800/50'}`}
              >
                Termékek
              </button>
            </nav>

            <div className="flex items-center space-x-3">
              {/* Kosár dropdown */}
              <div className="relative" ref={cartDropdownRef}>
                <button
                  onClick={() => {
                    setShowCartDropdown(prev => !prev);
                    setShowUserDropdown(false);
                  }}
                  className="px-4 py-2 bg-amber-300 text-amber-950 dark:bg-sky-700 dark:text-white rounded-xl hover:bg-amber-400 dark:hover:bg-sky-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                  aria-expanded={showCartDropdown}
                  aria-haspopup="dialog"
                  title="Kosár megnyitása"
                >
                  Kosár ({totalItems})
                </button>

                {showCartDropdown && (
                  <div className="absolute right-0 top-12 z-50 w-[min(92vw,560px)] max-h-[80vh] overflow-y-auto">
                    <Cart
                      cart={cart}
                      products={products}
                      totalItems={totalItems}
                      totalPrice={totalPrice}
                      discountedTotal={discountedTotal}
                      discountPercent={discountPercent}
                      couponCode={couponCode}
                      onCouponChange={setCouponCode}
                      onApplyCoupon={applyCoupon}
                      onClearCoupon={clearCoupon}
                      couponMessage={couponMessage}
                      onRemoveFromCart={removeFromCart}
                      onDeleteItem={deleteItemFromCart}
                      onAddToCart={addToCart}
                      onPayment={openCartPage}
                      isDropdown
                    />
                  </div>
                )}
              </div>

              {/* Kereső mező */}
              <div className="relative hidden md:block">
                <input
                  type="text"
                  placeholder="Keresés termékek között..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Termékek keresése"
                  className="px-4 py-2 pl-10 pr-4 border border-amber-300 dark:border-sky-500/60 rounded-xl bg-amber-50/90 dark:bg-sky-950/40 text-amber-950 dark:text-sky-100 placeholder:text-amber-700/70 dark:placeholder:text-sky-300/70 focus:ring-2 focus:ring-amber-400 dark:focus:ring-sky-500 focus:border-transparent w-64 shadow-sm transition-all duration-200"
                />
                <span className="absolute left-3 top-2.5 text-amber-600 dark:text-sky-300" aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                </span>
              </div>

              {/* Felhasználói fiók */}
              {user ? (
                <div className="flex items-center gap-2">
                  <div className="relative" ref={userDropdownRef}>
                    <button
                      onClick={() => {
                        setShowUserDropdown(prev => !prev);
                        setShowCartDropdown(false);
                      }}
                      className="px-4 py-2.5 border border-amber-300 dark:border-sky-600/60 bg-amber-100 dark:bg-sky-900/40 text-amber-950 dark:text-sky-100 rounded-xl hover:bg-amber-200 dark:hover:bg-sky-800/50 transition-all duration-200 text-base flex items-center gap-3"
                      aria-expanded={showUserDropdown}
                      aria-haspopup="menu"
                      title="Fiók menü"
                    >
                      <span className="w-8 h-8 bg-amber-300 text-amber-950 dark:bg-sky-700 dark:text-white rounded-full flex items-center justify-center font-semibold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="hidden sm:inline font-semibold">{user.name}</span>
                      <span className="text-sm">▾</span>
                    </button>

                    {showUserDropdown && (
                      <div className="absolute right-0 top-14 z-50 min-w-[220px] bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 rounded-xl shadow-xl p-2" role="menu">
                        <button
                          onClick={() => {
                            setShowFavoritesOnly(prev => !prev);
                            setCurrentPage(1);
                            setShowUserDropdown(false);
                            setSelectedProductId(null);
                            setShowCartPage(false);
                          }}
                          className="w-full text-left px-4 py-3 rounded-lg text-amber-950 dark:text-sky-100 hover:bg-amber-100 dark:hover:bg-sky-900/40 transition-colors text-base"
                          role="menuitem"
                        >
                          {showFavoritesOnly ? 'Összes termék' : `Kedvencek (${favorites.length})`}
                        </button>
                        <button
                          onClick={() => {
                            setShowOrderHistory(true);
                            setShowUserDropdown(false);
                          }}
                          className="w-full text-left px-4 py-3 rounded-lg text-amber-950 dark:text-sky-100 hover:bg-amber-100 dark:hover:bg-sky-900/40 transition-colors text-base"
                          role="menuitem"
                        >
                          Rendelések
                        </button>
                        <button
                          onClick={() => {
                            logout();
                            setShowUserDropdown(false);
                          }}
                          className="w-full text-left px-4 py-3 rounded-lg text-amber-950 dark:text-sky-100 hover:bg-amber-100 dark:hover:bg-sky-900/40 transition-colors text-base"
                          role="menuitem"
                        >
                          Kilépés
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Dark Mode Toggle - usernév jobb oldalán */}
                  <button
                    onClick={toggleDarkMode}
                    className="p-2.5 rounded-xl border border-amber-300 dark:border-sky-600/60 bg-amber-100 dark:bg-sky-900/40 hover:bg-amber-200 dark:hover:bg-sky-800/50 transition-all duration-200 shadow-sm hover:shadow-md"
                    title={isDarkMode ? 'Világos mód' : 'Sötét mód'}
                  >
                    {isDarkMode ? (
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2.75v2.5M12 18.75v2.5M21.25 12h-2.5M5.25 12h-2.5M18.54 5.46l-1.77 1.77M7.23 16.77l-1.77 1.77M18.54 18.54l-1.77-1.77M7.23 7.23 5.46 5.46" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-amber-700" fill="currentColor" aria-hidden="true">
                        <path d="M14.68 3.32a1 1 0 0 1 .24 1.08A8 8 0 1 0 19.6 9.08a1 1 0 0 1 1.08.24 1 1 0 0 1 .19 1.09A10 10 0 1 1 13.6 3.13a1 1 0 0 1 1.08.19Z" />
                      </svg>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsRegisterMode(false);
                      setIsForgotPasswordMode(false);
                      setAuthError('');
                      setAuthSuccess('');
                      setShowLogin(true);
                    }}
                    className="px-4 py-2 bg-amber-300 text-amber-950 dark:bg-sky-700 dark:text-white rounded-xl hover:bg-amber-400 dark:hover:bg-sky-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                  >
                    Bejelentkezés
                  </button>

                  <button
                    onClick={toggleDarkMode}
                    className="p-2.5 rounded-xl border border-amber-300 dark:border-sky-600/60 bg-amber-100 dark:bg-sky-900/40 text-amber-900 dark:text-sky-100 hover:bg-amber-200 dark:hover:bg-sky-800/50 transition-all duration-200 shadow-sm hover:shadow-md"
                    title={isDarkMode ? 'Világos mód' : 'Sötét mód'}
                  >
                    {isDarkMode ? (
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2.75v2.5M12 18.75v2.5M21.25 12h-2.5M5.25 12h-2.5M18.54 5.46l-1.77 1.77M7.23 16.77l-1.77 1.77M18.54 18.54l-1.77-1.77M7.23 7.23 5.46 5.46" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-amber-700" fill="currentColor" aria-hidden="true">
                        <path d="M14.68 3.32a1 1 0 0 1 .24 1.08A8 8 0 1 0 19.6 9.08a1 1 0 0 1 1.08.24 1 1 0 0 1 .19 1.09A10 10 0 1 1 13.6 3.13a1 1 0 0 1 1.08.19Z" />
                      </svg>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile kereső */}
          <div className="mt-4 md:hidden">
            <div className="mb-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={goHome}
                className={`min-h-[44px] px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isHomeView
                  ? 'bg-amber-300 text-amber-950 dark:bg-sky-700 dark:text-white'
                  : 'bg-amber-100 text-amber-900 dark:bg-sky-900/40 dark:text-sky-100'}`}
              >
                Főoldal
              </button>
              <button
                type="button"
                onClick={openProductsPage}
                className={`min-h-[44px] px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isProductsView
                  ? 'bg-amber-300 text-amber-950 dark:bg-sky-700 dark:text-white'
                  : 'bg-amber-100 text-amber-900 dark:bg-sky-900/40 dark:text-sky-100'}`}
              >
                Termékek
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Keresés..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full min-h-[46px] px-4 py-3 pl-10 pr-4 border border-amber-300 dark:border-sky-500/60 rounded-xl bg-amber-50/90 dark:bg-sky-950/40 text-amber-950 dark:text-sky-100 placeholder:text-amber-700/70 dark:placeholder:text-sky-300/70 focus:ring-2 focus:ring-amber-400 dark:focus:ring-sky-500 focus:border-transparent shadow-sm transition-all duration-200"
              />
              <span className="absolute left-3 top-3.5 text-amber-600 dark:text-sky-300" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Termékek */}
      <main className="max-w-7xl mx-auto px-4 pt-6" role="main" aria-label="Termékek listája">
        {showFavoritesOnly && (
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-300 dark:border-sky-600/60 bg-amber-100 dark:bg-sky-900/40 text-amber-900 dark:text-sky-100 text-sm font-medium">
            Kedvencek nézet aktív
            <button
              onClick={() => setShowFavoritesOnly(false)}
              className="px-2 py-0.5 rounded-lg bg-amber-200 dark:bg-sky-800/60 hover:bg-amber-300 dark:hover:bg-sky-700/60 transition-colors"
            >
              Kikapcsolás
            </button>
          </div>
        )}

        {showCartPage ? (
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div>
              <Cart
                cart={cart}
                products={products}
                totalItems={totalItems}
                totalPrice={totalPrice}
                discountedTotal={discountedTotal}
                discountPercent={discountPercent}
                couponCode={couponCode}
                onCouponChange={setCouponCode}
                onApplyCoupon={applyCoupon}
                onClearCoupon={clearCoupon}
                couponMessage={couponMessage}
                onRemoveFromCart={removeFromCart}
                onDeleteItem={deleteItemFromCart}
                onAddToCart={addToCart}
                onPayment={processPayment}
                hideCheckoutButton
              />
              <button
                onClick={closeCartPage}
                className="mt-4 px-4 py-2 rounded-xl border border-amber-300 dark:border-sky-600/60 bg-amber-100 dark:bg-sky-900/40 text-amber-900 dark:text-sky-100 font-medium"
              >
                ← Vissza a termékekhez
              </button>
            </div>

            <div className="bg-amber-50/95 dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-amber-200 dark:border-slate-700 h-fit">
              <h3 className="text-xl font-semibold mb-4">💳 Fizetés</h3>
              <div className="mb-4">
                <p className="text-gray-600 dark:text-gray-300 mb-2">Összesen fizetendő:</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-sky-300">{discountedTotal.toLocaleString()} Ft</p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                processPayment();
              }}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kártyaszám</label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-3 py-2 border border-amber-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lejárat</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full px-3 py-2 border border-amber-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CVV</label>
                    <input
                      type="text"
                      placeholder="123"
                      className="w-full px-3 py-2 border border-amber-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={cart.length === 0}
                  className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Fizetés ({discountedTotal.toLocaleString()} Ft)
                </button>
              </form>
            </div>
          </section>
        ) : selectedProduct ? (
          <section className="bg-amber-50/95 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 rounded-2xl p-5 md:p-7 shadow-lg">
            <button
              onClick={closeProductDetails}
              className="mb-5 px-4 py-2 rounded-xl border border-amber-300 dark:border-sky-600/60 bg-amber-100 dark:bg-sky-900/40 text-amber-900 dark:text-sky-100 font-medium"
            >
              ← Vissza a termékekhez
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <div>
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-full h-[280px] sm:h-[360px] object-cover rounded-2xl border border-amber-200 dark:border-slate-700"
                />
              </div>

              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{selectedProduct.name}</h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{selectedProduct.description}</p>

                <div className="mt-5 flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                  <span className="px-2 py-1 rounded-md bg-amber-100 dark:bg-slate-700 border border-amber-200 dark:border-slate-600">{selectedProduct.category || 'Egyéb'}</span>
                  <span>Értékelés: {(selectedProduct.rating ?? 4.2).toFixed(1)} ⭐</span>
                </div>

                <p className="mt-6 text-3xl font-bold text-amber-800 dark:text-sky-200">
                  {selectedProduct.price.toLocaleString()} Ft
                </p>

                <div className="mt-4 flex items-center gap-3">
                  <div className="flex items-center rounded-xl overflow-hidden border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-800 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setDetailQuantity((prev) => Math.max(1, prev - 1))}
                      className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-amber-100 dark:hover:bg-slate-700"
                    >
                      -
                    </button>
                    <div className="w-12 h-10 flex items-center justify-center font-semibold text-gray-900 dark:text-white">
                      {detailQuantity}
                    </div>
                    <button
                      type="button"
                      onClick={() => setDetailQuantity((prev) => Math.min(99, prev + 1))}
                      className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-amber-100 dark:hover:bg-slate-700"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => addToCart(selectedProduct, detailQuantity)}
                    className="px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg bg-amber-300 text-amber-950 dark:bg-sky-700 dark:text-white hover:bg-amber-400 dark:hover:bg-sky-800"
                  >
                    Kosárba
                  </button>
                </div>

                <div className="mt-6 p-4 rounded-xl bg-amber-100/70 dark:bg-slate-700 border border-amber-200 dark:border-slate-600">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Vélemények</h3>
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {(selectedProduct.reviews ?? []).map((review, idx) => (
                      <div key={`${selectedProduct.id}-review-${idx}`} className="p-2 bg-white/70 dark:bg-slate-800 rounded text-xs">
                        <div className="flex justify-between items-start">
                          <span className="font-semibold text-gray-900 dark:text-white">{review.user}</span>
                          <span className="text-yellow-500">{'⭐'.repeat(review.rating)}</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mt-1">{review.comment}</p>
                      </div>
                    ))}
                    {(selectedProduct.reviews ?? []).length === 0 && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">Még nincs értékelés.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <>
            {!showProductsPage && (
              <>
            <section className="mb-8 rounded-3xl overflow-hidden border border-amber-300 dark:border-sky-700/60 shadow-2xl transition-all duration-500 hover:shadow-[0_25px_70px_-25px_rgba(249,115,22,0.45)] dark:hover:shadow-[0_25px_70px_-25px_rgba(14,165,233,0.38)]">
              <div className="relative bg-[radial-gradient(circle_at_10%_20%,#fde68a_0%,#f59e0b_38%,#f97316_70%,#ea580c_100%)] dark:bg-[radial-gradient(circle_at_10%_20%,#0c4a6e_0%,#0369a1_45%,#0f172a_100%)] text-white p-7 md:p-14">
                <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-white/15 blur-md animate-pulse" aria-hidden="true" />
                <div className="absolute -left-6 -bottom-8 w-28 h-28 rounded-full bg-white/10 blur-md animate-pulse" aria-hidden="true" />
                <p className="uppercase tracking-[0.24em] text-xs font-semibold text-amber-50/90 dark:text-sky-100/80">Modern Kiegészítők</p>
                <h2 className="mt-3 text-4xl sm:text-5xl md:text-6xl font-black leading-[1.05] tracking-tight">Fedezd fel a legjobb kiegészítőket</h2>
                <p className="mt-5 max-w-2xl text-amber-50/95 dark:text-sky-100/90 text-base md:text-lg transition-opacity duration-500">
                  Minőségi tech eszközök, friss akciók és vásárlóink kedvencei egy helyen. Kattints, válogass, és rakd össze a saját setupod.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    onClick={openProductsPage}
                    className="min-h-[46px] px-6 py-3 rounded-xl bg-white text-amber-700 dark:text-sky-700 font-bold hover:bg-amber-100 dark:hover:bg-sky-100 transition-all duration-200 hover:scale-[1.03] hover:shadow-lg"
                  >
                    Vásárlás most
                  </button>
                  <button
                    onClick={() => setShowFavoritesOnly(true)}
                    className="min-h-[46px] px-6 py-3 rounded-xl border border-white/70 text-white font-semibold hover:bg-white/10 transition-all duration-200 hover:scale-[1.03]"
                  >
                    Kedvencek nézete
                  </button>
                </div>
              </div>
            </section>

            {weeklyDeals.length > 0 && (
              <section className="mb-8">
                <div className="flex items-end justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-amber-900 dark:text-sky-100">Heti Akciók</h3>
                    <p className="text-sm text-amber-700/80 dark:text-sky-300/80">Kiemelt ajánlatok korlátozott ideig.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {weeklyDeals.map((item) => (
                    <article key={`deal-${item.id}`} className="bg-amber-50/95 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 rounded-2xl p-4 shadow-md">
                      <div className="aspect-[4/3] rounded-xl overflow-hidden mb-3 border border-amber-200 dark:border-slate-700">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                        -{Math.round(item.discountRate * 100)}%
                      </div>
                      <h4 className="mt-2 font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 min-h-[3rem]">{item.name}</h4>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-lg font-bold text-amber-800 dark:text-sky-300">{item.discountedPrice.toLocaleString()} Ft</span>
                        <span className="text-sm line-through text-gray-500">{item.price.toLocaleString()} Ft</span>
                      </div>
                      <button
                        onClick={() => openProductDetails(item.id)}
                        className="mt-3 w-full px-3 py-2 rounded-xl bg-amber-300 text-amber-950 dark:bg-sky-700 dark:text-white font-semibold hover:bg-amber-400 dark:hover:bg-sky-800 transition-colors"
                      >
                        Akció megnyitása
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {recommendedProducts.length > 0 && (
              <section className="mb-8">
                <div className="flex items-end justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-amber-900 dark:text-sky-100">Ajánlott Termékek</h3>
                    <p className="text-sm text-amber-700/80 dark:text-sky-300/80">Magas értékelésű, népszerű választások.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {recommendedProducts.map((item) => (
                    <article key={`recommended-${item.id}`} className="bg-amber-50/95 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 rounded-2xl p-4 shadow-md">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 min-h-[3rem]">{item.name}</h4>
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">Értékelés: {(item.rating ?? 0).toFixed(1)} ⭐</p>
                      <p className="mt-3 text-lg font-bold text-amber-800 dark:text-sky-300">{item.price.toLocaleString()} Ft</p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => openProductDetails(item.id)}
                          className="px-3 py-2 rounded-xl border border-amber-300 dark:border-sky-700 text-amber-900 dark:text-sky-100 font-semibold hover:bg-amber-100 dark:hover:bg-sky-900/40 transition-colors"
                        >
                          Részletek
                        </button>
                        <button
                          onClick={() => addToCart(item, 1)}
                          className="px-3 py-2 rounded-xl bg-amber-300 text-amber-950 dark:bg-sky-700 dark:text-white font-semibold hover:bg-amber-400 dark:hover:bg-sky-800 transition-colors"
                        >
                          Kosárba
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <section className="mb-8 bg-amber-50/95 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 rounded-2xl p-5 md:p-6 shadow-md">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-amber-900 dark:text-sky-100">Teljes Katalógus</h3>
                  <p className="text-sm text-amber-700/80 dark:text-sky-300/80 mt-1">
                    A termékkártyák külön oldalon érhetők el, részletes szűrőkkel és összehasonlítással.
                  </p>
                </div>
                <button
                  onClick={openProductsPage}
                  className="px-5 py-2.5 rounded-xl bg-amber-300 text-amber-950 dark:bg-sky-700 dark:text-white font-semibold hover:bg-amber-400 dark:hover:bg-sky-800 transition-colors"
                >
                  Ugrás a termékoldalra
                </button>
              </div>
            </section>
              </>
            )}

            {showProductsPage && (
              <>
                {/* Mobile szűrő gomb */}
                <div className="md:hidden mb-4">
                  <button
                    onClick={() => setShowFiltersMobile(true)}
                    className="min-h-[44px] flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-300 dark:border-sky-600/60 bg-amber-100 dark:bg-sky-900/40 text-amber-900 dark:text-sky-100 font-medium text-sm shadow-sm"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 3H2l8 9.46V19l4 2v-8.54z" />
                    </svg>
                    Szűrők
                    {(filterState.categories.length + filterState.colors.length + (filterState.inStockOnly ? 1 : 0)) > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-400 dark:bg-sky-600 text-xs font-bold text-amber-950 dark:text-white">
                        {filterState.categories.length + filterState.colors.length + (filterState.inStockOnly ? 1 : 0)}
                      </span>
                    )}
                  </button>
                </div>

                <div className="flex gap-6 items-start">
                  <FilterSidebar
                    filters={filterState}
                    onChange={(f) => { setFilterState(f); setCurrentPage(1); }}
                    availableCategories={availableCategories}
                    absoluteMin={absoluteMin}
                    absoluteMax={absoluteMax}
                    productCount={filteredAndSortedProducts.length}
                    totalCount={products.length}
                    isOpen={showFiltersMobile}
                    onClose={() => setShowFiltersMobile(false)}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {paginatedProducts.map(product => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onAddToCart={addToCart}
                          onOpenDetails={() => openProductDetails(product.id)}
                          isInCart={isInCart(product.id)}
                          isAnimating={animatingProduct === product.id}
                          isFavorite={isFavorite(product.id)}
                          onToggleFavorite={() => toggleFavorite(product.id)}
                          isInCompare={isInCompare(product.id)}
                          onToggleCompare={() => toggleCompare(product.id)}
                        />
                      ))}
                    </div>

                    {compareSelection.length > 0 && (
                      <div className="mt-8 p-4 bg-amber-50/95 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 rounded-2xl">
                        <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-gray-100">📊 Összehasonlítás</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {products
                            .filter(p => compareSelection.includes(p.id))
                            .map(p => (
                              <div key={p.id} className="p-3 bg-amber-100/70 dark:bg-slate-700 rounded-lg">
                                <h4 className="font-semibold text-gray-900 dark:text-white">{p.name}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{p.description}</p>
                                <p className="text-md font-bold text-amber-700 dark:text-sky-300">{p.price.toLocaleString()} Ft</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Értékelés: {(p.rating ?? 4.1).toFixed(1)} ⭐</p>
                                <button
                                  onClick={() => toggleCompare(p.id)}
                                  className="mt-2 px-3 py-1 rounded-lg bg-red-500 text-white text-xs"
                                >
                                  Eltávolít
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {filteredAndSortedProducts.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-amber-700 dark:text-sky-300 text-lg">Nincs találat a megadott szűrőkre.</p>
                        <p className="text-sm text-amber-600/70 dark:text-sky-400/70 mt-1">Próbálj más feltételeket!</p>
                      </div>
                    )}

                    {paginatedProducts.length < filteredAndSortedProducts.length && (
                      <div className="text-center py-8">
                        <p className="text-amber-700 dark:text-sky-300 animate-pulse">⏳ További termékek betöltése...</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>

      <footer className="mt-10 border-t border-amber-200 dark:border-slate-800 bg-amber-50/90 dark:bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <section>
              <h3 className="text-lg font-bold text-amber-900 dark:text-sky-100">Modern Kiegészítők</h3>
              <p className="mt-2 text-sm text-amber-800/80 dark:text-slate-300">
                Minőségi tech kiegészítők gyors szállítással és megbízható támogatással.
              </p>
            </section>

            <section>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-amber-800 dark:text-sky-300">Gyors linkek</h4>
              <div className="mt-3 flex flex-col gap-2 text-sm">
                <button type="button" onClick={goHome} className="text-left text-amber-900 dark:text-slate-200 hover:text-amber-700 dark:hover:text-sky-300">Főoldal</button>
                <button type="button" onClick={openProductsPage} className="text-left text-amber-900 dark:text-slate-200 hover:text-amber-700 dark:hover:text-sky-300">Termékek</button>
                <button type="button" onClick={openCartPage} className="text-left text-amber-900 dark:text-slate-200 hover:text-amber-700 dark:hover:text-sky-300">Kosár</button>
              </div>
            </section>

            <section>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-amber-800 dark:text-sky-300">Vásárlás</h4>
              <ul className="mt-3 space-y-2 text-sm text-amber-900 dark:text-slate-200">
                <li>Szállítás: 1-3 munkanap</li>
                <li>Biztonságos fizetés</li>
                <li>14 napos visszaküldés</li>
              </ul>
            </section>

            <section>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-amber-800 dark:text-sky-300">Kapcsolat</h4>
              <ul className="mt-3 space-y-2 text-sm text-amber-900 dark:text-slate-200">
                <li>Email: hello@modernkiegeszitok.hu</li>
                <li>Telefon: +36 30 123 4567</li>
                <li>H-P: 9:00 - 17:00</li>
              </ul>
            </section>
          </div>

          <div className="mt-8 pt-4 border-t border-amber-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-amber-800/80 dark:text-slate-400">
            <p>© {new Date().getFullYear()} Modern Kiegészítők. Minden jog fenntartva.</p>
            <div className="flex items-center gap-4">
              <button type="button" className="hover:text-amber-700 dark:hover:text-sky-300">ÁSZF</button>
              <button type="button" className="hover:text-amber-700 dark:hover:text-sky-300">Adatkezelés</button>
              <button type="button" className="hover:text-amber-700 dark:hover:text-sky-300">Cookie</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLogin && (
        <div
          className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAuthModal();
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl overflow-hidden border border-amber-200/70 dark:border-sky-700/60 shadow-2xl bg-amber-50 dark:bg-slate-900">
            <div className="px-6 pt-6 pb-4 border-b border-amber-200 dark:border-slate-800 bg-gradient-to-r from-amber-100 via-amber-50 to-orange-100 dark:from-sky-950 dark:via-slate-900 dark:to-sky-950">
              <p className="text-xs uppercase tracking-[0.22em] text-amber-700 dark:text-sky-300">Fiók</p>
              <h3 className="mt-1 text-xl font-bold text-amber-950 dark:text-sky-100">
                {isForgotPasswordMode ? 'Jelszó visszaállítás' : (isRegisterMode ? 'Regisztráció' : 'Bejelentkezés')}
              </h3>
              <p className="mt-1 text-sm text-amber-800/80 dark:text-slate-300">
                {isForgotPasswordMode
                  ? 'Adj meg új jelszót a fiókodhoz.'
                  : (isRegisterMode ? 'Hozz létre új fiókot néhány lépésben.' : 'Lépj be a rendeléseid és kedvenceid kezeléséhez.')}
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-2 mb-5 p-1 rounded-xl bg-amber-100/70 dark:bg-slate-800 border border-amber-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(false);
                    setIsForgotPasswordMode(false);
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  className={`px-2 py-2 rounded-lg text-xs font-semibold transition-colors ${!isRegisterMode && !isForgotPasswordMode
                    ? 'bg-amber-300 text-amber-950 dark:bg-sky-700 dark:text-white'
                    : 'text-amber-900 dark:text-slate-200 hover:bg-amber-200/70 dark:hover:bg-slate-700'}`}
                >
                  Belépés
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(true);
                    setIsForgotPasswordMode(false);
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  className={`px-2 py-2 rounded-lg text-xs font-semibold transition-colors ${isRegisterMode
                    ? 'bg-amber-300 text-amber-950 dark:bg-sky-700 dark:text-white'
                    : 'text-amber-900 dark:text-slate-200 hover:bg-amber-200/70 dark:hover:bg-slate-700'}`}
                >
                  Regisztráció
                </button>
              </div>

              <form onSubmit={isForgotPasswordMode ? handleForgotPasswordSubmit : (isRegisterMode ? handleRegisterSubmit : handleLoginSubmit)}>
                {isRegisterMode && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-amber-900 dark:text-slate-200 mb-1">Felhasználónév</label>
                    <input
                      type="text"
                      name="username"
                      placeholder="Pl. modernvasarlo"
                      className="w-full px-3 py-2.5 rounded-xl border border-amber-300 dark:border-slate-600 bg-white/90 dark:bg-slate-800 text-amber-950 dark:text-slate-100 placeholder:text-amber-700/60 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-sky-500"
                      required
                    />
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-amber-900 dark:text-slate-200 mb-1">E-mail</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="nev@pelda.hu"
                    className="w-full px-3 py-2.5 rounded-xl border border-amber-300 dark:border-slate-600 bg-white/90 dark:bg-slate-800 text-amber-950 dark:text-slate-100 placeholder:text-amber-700/60 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-sky-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-amber-900 dark:text-slate-200 mb-1">
                    {isForgotPasswordMode ? 'Új jelszó' : 'Jelszó'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPrimaryPassword ? 'text' : 'password'}
                      name={isForgotPasswordMode ? 'newPassword' : 'password'}
                      placeholder={isForgotPasswordMode ? 'Legalább 6 karakter' : 'Add meg a jelszavad'}
                      className="w-full px-3 pr-16 py-2.5 rounded-xl border border-amber-300 dark:border-slate-600 bg-white/90 dark:bg-slate-800 text-amber-950 dark:text-slate-100 placeholder:text-amber-700/60 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-sky-500"
                      onChange={(event) => setAuthPasswordDraft(event.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPrimaryPassword(prev => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs rounded-md bg-amber-100 text-amber-900 dark:bg-slate-700 dark:text-slate-200 hover:bg-amber-200 dark:hover:bg-slate-600"
                      aria-label={showPrimaryPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
                    >
                      {showPrimaryPassword ? 'Rejt' : 'Mutat'}
                    </button>
                  </div>

                  {(isRegisterMode || isForgotPasswordMode) && (
                    <div className="mt-2">
                      <div className="h-1.5 rounded-full bg-amber-100 dark:bg-slate-700 overflow-hidden">
                        <div className={`h-full ${authPasswordStrength.color} ${authPasswordStrength.widthClass} transition-all`} />
                      </div>
                      <p className={`mt-1 text-xs font-medium ${authPasswordStrength.textColor}`}>
                        Jelszó erőssége: {authPasswordStrength.label}
                      </p>
                    </div>
                  )}

                  {!isRegisterMode && !isForgotPasswordMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPasswordMode(true);
                        setIsRegisterMode(false);
                        setAuthError('');
                        setAuthSuccess('');
                      }}
                      className="mt-2 text-xs font-medium text-amber-700 hover:text-amber-800 dark:text-sky-300 dark:hover:text-sky-200"
                    >
                      Elfelejtetted a jelszavad?
                    </button>
                  )}
                </div>

                {(isRegisterMode || isForgotPasswordMode) && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-amber-900 dark:text-slate-200 mb-1">
                      {isForgotPasswordMode ? 'Új jelszó megerősítése' : 'Jelszó megerősítése'}
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name={isForgotPasswordMode ? 'newPasswordConfirm' : 'passwordConfirm'}
                        placeholder="Ismételd meg a jelszót"
                        className="w-full px-3 pr-16 py-2.5 rounded-xl border border-amber-300 dark:border-slate-600 bg-white/90 dark:bg-slate-800 text-amber-950 dark:text-slate-100 placeholder:text-amber-700/60 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-sky-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(prev => !prev)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs rounded-md bg-amber-100 text-amber-900 dark:bg-slate-700 dark:text-slate-200 hover:bg-amber-200 dark:hover:bg-slate-600"
                        aria-label={showConfirmPassword ? 'Megerősítő jelszó elrejtése' : 'Megerősítő jelszó megjelenítése'}
                      >
                        {showConfirmPassword ? 'Rejt' : 'Mutat'}
                      </button>
                    </div>
                  </div>
                )}

                {authError && (
                  <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{authError}</p>
                )}
                {authSuccess && (
                  <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">{authSuccess}</p>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isAuthLoading}
                    className="flex-1 bg-amber-300 text-amber-950 dark:bg-sky-700 dark:text-white py-2.5 rounded-xl font-semibold hover:bg-amber-400 dark:hover:bg-sky-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isAuthLoading
                      ? (isForgotPasswordMode ? 'Frissítés...' : (isRegisterMode ? 'Regisztráció...' : 'Beléptetés...'))
                      : (isForgotPasswordMode ? 'Jelszó frissítése' : (isRegisterMode ? 'Regisztráció' : 'Bejelentkezés'))}
                  </button>
                  <button
                    type="button"
                    onClick={closeAuthModal}
                    className="px-4 bg-amber-200 text-amber-900 dark:bg-slate-700 dark:text-slate-200 py-2.5 rounded-xl font-semibold hover:bg-amber-300 dark:hover:bg-slate-600 transition-colors"
                  >
                    Mégse
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Rendelés történet modal */}
      {showOrderHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-amber-50 dark:bg-gray-800 p-6 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto border border-amber-200 dark:border-slate-700">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">📋 Rendelés történet</h3>
            
            {orderHistory.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">Még nincs rendelésed.</p>
            ) : (
              <div className="space-y-4">
                {orderHistory.map((order: any) => (
                  <div key={order.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          Rendelés #{order.id}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(order.date).toLocaleDateString('hu-HU')}
                        </p>
                      </div>
                      <p className="font-bold text-green-600">
                        {order.totalPrice.toLocaleString()} Ft
                      </p>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {order.items.length} termék • {order.user}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowOrderHistory(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                Bezárás
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;