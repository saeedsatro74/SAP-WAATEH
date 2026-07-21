import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { Product } from '../types';
import { Language } from '../translations';

interface SearchableSelectProps {
  products: Product[];
  selectedSku: string;
  onSelect: (sku: string) => void;
  lang: Language;
}

export default function SearchableSelect({ products, selectedSku, onSelect, lang }: SearchableSelectProps) {
  const isRtl = lang === 'fa';
  const containerRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Find currently selected product
  const selectedProduct = products.find((p) => p.sku === selectedSku);

  // Synchronize the display text with the selected SKU
  useEffect(() => {
    if (selectedProduct) {
      // When not actively editing, display the formatted label
      if (!isFocused) {
        setSearchQuery(`[${selectedProduct.sku}] ${selectedProduct.name}`);
      }
    } else {
      setSearchQuery('');
    }
  }, [selectedSku, selectedProduct, isFocused]);

  // Handle outside click to close dropdown and reset query to selected item
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
        if (selectedProduct) {
          setSearchQuery(`[${selectedProduct.sku}] ${selectedProduct.name}`);
        } else {
          setSearchQuery('');
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedProduct]);

  // Filter products based on search query (matches name or SKU)
  const filteredProducts = products.filter((p) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query || !isFocused) return true; // Show all if not searching/focused

    // If query matches the exact selected label, show all or don't restrict fully
    if (selectedProduct && query === `[${selectedProduct.sku}] ${selectedProduct.name}`.toLowerCase()) {
      return true;
    }

    const nameMatch = p.name.toLowerCase().includes(query);
    const skuMatch = p.sku.toLowerCase().includes(query);
    return nameMatch || skuMatch;
  });

  const handleSelectProduct = (sku: string) => {
    onSelect(sku);
    setIsOpen(false);
    setIsFocused(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setIsOpen(true);
    // Clear search on focus to make it easy for user to type fresh or select other,
    // but preserve current query text selected/highlighted if desired, or just clear.
    // Cleaving to standard UX: clear the text or select all so they can start typing right away.
    setSearchQuery('');
  };

  return (
    <div className="relative w-full" ref={containerRef} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Anchor Input Box */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={handleFocus}
          placeholder={
            isRtl 
              ? 'جستجو با نام کالا یا کد SKU...' 
              : 'Search by product name or SKU...'
          }
          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-10 text-xs font-black text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-xs cursor-text"
        />

        {/* Magnifying Search Icon */}
        <div className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none`}>
          <Search size={14} />
        </div>

        {/* Dropdown Chevron Toggle Icon */}
        <button
          type="button"
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
              setIsFocused(false);
              if (selectedProduct) {
                setSearchQuery(`[${selectedProduct.sku}] ${selectedProduct.name}`);
              }
            } else {
              handleFocus();
            }
          }}
          className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-all p-1`}
        >
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Floating Dropdown Results Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 mt-1.5 max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-lg z-50 p-1.5 space-y-0.5"
          >
            {filteredProducts.length === 0 ? (
              <div className="p-4 text-center text-xs font-bold text-slate-400">
                {isRtl ? 'کالایی یافت نشد ⚠️' : 'No matching products found ⚠️'}
              </div>
            ) : (
              filteredProducts.map((p) => {
                const isSelected = p.sku === selectedSku;
                return (
                  <button
                    key={p.sku}
                    type="button"
                    onClick={() => handleSelectProduct(p.sku)}
                    className={`w-full flex items-center justify-between text-right p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-col gap-0.5 items-start">
                      <span className="font-mono text-[10px] font-extrabold text-slate-400 tracking-wider">
                        SKU: {p.sku}
                      </span>
                      <span className="text-slate-800 font-extrabold">{p.name}</span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold">
                        {isRtl ? 'موجودی:' : 'Stock:'} {p.quantity} {p.unit}
                      </span>
                      {isSelected && <Check size={14} className="text-blue-600" />}
                    </div>
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
