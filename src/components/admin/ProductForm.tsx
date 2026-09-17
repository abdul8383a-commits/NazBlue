"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Upload, X, Loader2 } from "lucide-react";

export default function ProductForm({ categories, initialData }: { categories: any[], initialData?: any }) {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    category_id: initialData?.category_id || categories[0]?.id || "",
    gender: initialData?.gender || "unisex",
    base_price: initialData?.base_price?.toString() || "",
    discount_price: initialData?.discount_price?.toString() || "",
    is_active: initialData?.is_active ?? true,
  });
  
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  
  // Variants
  const [variants, setVariants] = useState(initialData?.product_variants?.length > 0 
    ? initialData.product_variants 
    : [{ size: "M", color: "Blue", stock_quantity: "10", sku: "" }]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleVariantChange = (index: number, field: string, value: string) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const addVariant = () => {
    setVariants([...variants, { size: "L", color: "White", stock_quantity: "0", sku: "" }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    try {
      setUploading(true);
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
      
      setImages([...images, data.publicUrl]);
    } catch (error: any) {
      alert("Error uploading image: (Did you create the public 'product-images' bucket in Supabase?) " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 1. Create Product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: formData.name,
          description: formData.description,
          category_id: formData.category_id,
          gender: formData.gender,
          base_price: parseFloat(formData.base_price),
          discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
          images: images,
          is_active: formData.is_active
        })
        .select()
        .single();
        
      if (productError) throw productError;

      // 2. Create Variants
      const variantInserts = variants.map(v => ({
        product_id: product.id,
        size: v.size,
        color: v.color,
        stock_quantity: parseInt(v.stock_quantity),
        sku: v.sku || `${product.id.substring(0,4)}-${v.size}-${v.color}`.toUpperCase()
      }));

      const { error: variantError } = await supabase
        .from('product_variants')
        .insert(variantInserts);

      if (variantError) throw variantError;

      router.push('/admin/products');
      router.refresh();
      
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-8 pb-12">
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-primary">Basic Info</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input required name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full p-2 border border-gray-300 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none"></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select name="category_id" value={formData.category_id} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white">
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white">
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="unisex">Unisex</option>
              <option value="kids">Kids</option>
              <option value="accessories">Accessories</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base Price ($)</label>
            <input required type="number" step="0.01" name="base_price" value={formData.base_price} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount Price ($)</label>
            <input type="number" step="0.01" name="discount_price" value={formData.discount_price} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
          </div>
          <div className="col-span-2 flex items-center mt-2 bg-gray-50 p-3 rounded border">
            <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleChange} className="w-4 h-4 text-primary rounded" />
            <label htmlFor="is_active" className="ml-2 block text-sm font-medium text-gray-900">Active / Visible on Storefront</label>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-primary">Images (Supabase Storage)</h3>
        <div className="flex flex-wrap gap-4 mb-4">
          {images.map((url, idx) => (
            <div key={idx} className="relative group w-32 h-32 border border-gray-200 rounded overflow-hidden">
              <img src={url} className="w-full h-full object-cover" alt="Product" />
              <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"><X className="w-3 h-3"/></button>
            </div>
          ))}
          
          <label className="w-32 h-32 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center text-gray-500 hover:text-primary hover:border-primary cursor-pointer transition-colors bg-gray-50">
            {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
            <span className="text-xs mt-2 font-medium">Upload Image</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="text-lg font-semibold text-primary">Inventory Variants</h3>
          <button type="button" onClick={addVariant} className="text-sm bg-blue-50 text-primary font-medium px-3 py-1.5 rounded hover:bg-blue-100 transition-colors">
            + Add Variant
          </button>
        </div>
        
        <div className="space-y-4 pt-2">
          {variants.map((v, idx) => (
            <div key={idx} className="flex gap-4 items-end bg-gray-50 p-3 rounded border border-gray-200">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Size</label>
                <input value={v.size} onChange={(e) => handleVariantChange(idx, 'size', e.target.value)} required className="w-full p-2 border border-gray-300 rounded text-sm focus:border-primary outline-none" placeholder="S, M, L..." />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Color</label>
                <input value={v.color} onChange={(e) => handleVariantChange(idx, 'color', e.target.value)} required className="w-full p-2 border border-gray-300 rounded text-sm focus:border-primary outline-none" placeholder="Blue, White..." />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Stock</label>
                <input type="number" value={v.stock_quantity} onChange={(e) => handleVariantChange(idx, 'stock_quantity', e.target.value)} required className="w-full p-2 border border-gray-300 rounded text-sm focus:border-primary outline-none" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">SKU</label>
                <input value={v.sku} onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)} className="w-full p-2 border border-gray-300 rounded text-sm focus:border-primary outline-none" placeholder="Auto-generated" />
              </div>
              <button type="button" onClick={() => removeVariant(idx)} disabled={variants.length === 1} className="p-2 mb-1 text-red-500 hover:bg-red-100 rounded disabled:opacity-30 transition-colors">
                <X className="w-5 h-5"/>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-4 border-t pt-6">
        <button type="button" onClick={() => router.back()} className="px-6 py-2.5 border border-gray-300 rounded font-bold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
        <button type="submit" disabled={loading} className="px-8 py-2.5 bg-[#1E3A8A] text-white rounded font-bold hover:bg-[#1E3A8A]/90 disabled:opacity-50 flex items-center transition-colors shadow-md">
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Product to Store
        </button>
      </div>
    </form>
  );
}
