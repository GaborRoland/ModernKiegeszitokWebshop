import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProductCard from './ProductCard'

const mockProduct = {
  id: 1,
  name: 'Test Product',
  price: 10000,
  description: 'Test description',
  image: 'test.jpg'
}

describe('ProductCard', () => {
  it('renders product information correctly', () => {
    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={() => {}}
        isInCart={false}
        isAnimating={false}
        isFavorite={false}
        onToggleFavorite={() => {}}
      />
    )

    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('10 000 Ft')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('shows favorite button', () => {
    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={() => {}}
        isInCart={false}
        isAnimating={false}
        isFavorite={true}
        onToggleFavorite={() => {}}
      />
    )

    expect(screen.getByText('❤️')).toBeInTheDocument()
  })
})