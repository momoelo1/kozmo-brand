import React from 'react';
import use3DEffect from '../../hooks/use3DEffect';

const ProductCard3D = ({ 
  children, 
  className = '', 
  onClick, 
  intensity = 15,
  enable3D = true,
  ...props 
}) => {
  const card3DRef = enable3D ? use3DEffect(intensity) : null;

  return (
    <div 
      ref={card3DRef}
      className={className}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default ProductCard3D; 