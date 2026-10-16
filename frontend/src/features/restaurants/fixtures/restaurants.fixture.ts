import type { RestaurantSummary } from '../types'

// SYNTHETIC FIXTURES ONLY. Hours, availability, prices and delivery pairs are
// fictional frozen examples, never real surveys, live status, or API responses.
export const fixturePickupPoint = 'Cổng chính VJU'
export const fixtureCategories = ['Cơm', 'Bún · Phở', 'Bánh mì', 'Đồ uống', 'Ăn vặt'] as const

export const restaurantFixtures = [
  {
    id: '9007199254740993', name: 'Cơm Gà Bà Tư', cuisine: 'Cơm',
    description: 'Cơm dẻo, gà giòn — bữa trưa thật tròn vị.', hours: '07:00 – 21:00',
    isActive: true, isOpen: true, isAcceptingOrders: true,
    imageSrc: '/fixtures/rice.svg', illustrationTone: 'rice', deliveryFeeVnd: '5000', distanceMetres: 450,
    dishes: [
      { id: '101', category: 'Cơm', priceVnd: '45000', isVisible: true, isAvailable: true },
      { id: '102', category: 'Đồ uống', priceVnd: '15000', isVisible: true, isAvailable: true },
    ],
  },
  {
    id: '2', name: 'Bún Chả Hà Nội 79', cuisine: 'Bún · Phở',
    description: 'Thơm mùi than hoa, đậm vị Hà Nội.', hours: '10:00 – 20:30',
    isActive: true, isOpen: true, isAcceptingOrders: true,
    imageSrc: '/fixtures/noodles.svg', illustrationTone: 'noodles', deliveryFeeVnd: '8000', distanceMetres: 1100,
    dishes: [{ id: '201', category: 'Bún · Phở', priceVnd: '50000', isVisible: true, isAvailable: true }],
  },
  {
    id: '3', name: 'Bánh Mì Cô Lan', cuisine: 'Bánh mì',
    description: 'Ổ bánh nóng giòn cho những ngày bận rộn.', hours: '06:30 – 19:00',
    isActive: true, isOpen: true, isAcceptingOrders: true,
    imageSrc: '/fixtures/bread.svg', illustrationTone: 'bread', deliveryFeeVnd: '0', distanceMetres: 200,
    dishes: [
      { id: '301', category: 'Bánh mì', priceVnd: '25000', isVisible: true, isAvailable: true },
      { id: '302', category: 'Bánh mì', priceVnd: '30000', isVisible: true, isAvailable: true },
      { id: '303', category: 'Ăn vặt', priceVnd: '29999', isVisible: true, isAvailable: false },
    ],
  },
  {
    id: '4', name: 'Phở Bò Gia Truyền', cuisine: 'Bún · Phở',
    description: 'Nước dùng thanh, một tô ấm bụng.', hours: '06:00 – 13:30',
    isActive: true, isOpen: false, isAcceptingOrders: true,
    imageSrc: '/fixtures/noodles.svg', illustrationTone: 'noodles', deliveryFeeVnd: '6000', distanceMetres: 750,
    dishes: [
      { id: '401', category: 'Bún · Phở', priceVnd: '55000', isVisible: true, isAvailable: true },
      { id: '402', category: 'Bún · Phở', priceVnd: '50001', isVisible: true, isAvailable: true },
    ],
  },
  {
    id: '5', name: 'Trà Sữa Mộc', cuisine: 'Đồ uống',
    description: 'Chút ngọt ngào cho giờ nghỉ giữa buổi.', hours: '09:00 – 22:00',
    isActive: true, isOpen: true, isAcceptingOrders: false,
    imageSrc: null, illustrationTone: 'tea', deliveryFeeVnd: null, distanceMetres: null,
    dishes: [{ id: '501', category: 'Đồ uống', priceVnd: '35000', isVisible: true, isAvailable: false }],
  },
  {
    id: '6', name: 'Bếp Nhà — Cơm niêu & món Việt mỗi ngày', cuisine: 'Cơm · Ăn vặt',
    description: 'Bữa cơm nhà thân quen ngay gần trường.', hours: '10:30 – 20:00',
    isActive: true, isOpen: true, isAcceptingOrders: true,
    // Deliberately invalid image data exercises the broken-image fallback.
    imageSrc: 'data:image/png;base64,invalid-fixture', illustrationTone: 'rice', deliveryFeeVnd: null, distanceMetres: null,
    dishes: [
      { id: '601', category: 'Cơm', priceVnd: '49000', isVisible: true, isAvailable: true },
      { id: '602', category: 'Ăn vặt', priceVnd: '20000', isVisible: true, isAvailable: true },
      { id: '603', category: 'Bánh mì', priceVnd: '10000', isVisible: false, isAvailable: true },
    ],
  },
  {
    id: '7', name: 'Quán đã ngừng hoạt động', cuisine: 'Cơm', description: 'Excluded fixture.', hours: '07:00 – 21:00',
    isActive: false, isOpen: true, isAcceptingOrders: true,
    imageSrc: null, illustrationTone: 'rice', deliveryFeeVnd: '0', distanceMetres: 100,
    dishes: [{ id: '701', category: 'Cơm', priceVnd: '10000', isVisible: true, isAvailable: true }],
  },
] as const satisfies readonly RestaurantSummary[]
