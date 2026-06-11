import axiosInstance from './axios';

export const fetchProducts = async () => {
    const response = await axiosInstance.get('/products');
    const { allProducts } = response.data;

    if (!allProducts || !Array.isArray(allProducts)) {
        return [];
    }

    return allProducts.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description || 'No description available',
        price: product.default_price ? (product.default_price.unit_amount / 100) : 0,
        image: product.images?.[0] || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
        imageBack: product.images?.[1] || null,
        category: product.metadata?.category || 'uncategorized',
        sizes: product.metadata?.sizes
          ? product.metadata.sizes.split(',').map(s => s.trim()).filter(Boolean)
          : []
    }));
};
