"use client";

import { useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function CategoryActions({ category, productCount }: { category: any, productCount: number }) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleEdit = async () => {
    const newName = window.prompt("Enter new category name:", category.name);
    if (!newName || newName === category.name) return;

    const newGender = window.prompt("Enter gender (men, women, unisex, kids, accessories):", category.gender);
    if (!newGender) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: newName, gender: newGender.toLowerCase() })
        .eq('id', category.id);

      if (error) throw error;
      router.refresh();
    } catch (err: any) {
      alert("Failed to update category: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (productCount > 0) {
      alert(`Cannot delete this category because ${productCount} product(s) are assigned to it. Please reassign or delete those products first.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the category "${category.name}"?`)) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id);

      if (error) {
        if (error.code === '23503' || error.message.includes('foreign key constraint')) {
          throw new Error("Cannot delete category because it is still referenced by other records.");
        }
        throw error;
      }
      
      router.refresh();
    } catch (err: any) {
      alert("Failed to delete category: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-end space-x-3">
      <button 
        onClick={handleEdit}
        disabled={loading}
        className="text-primary hover:text-primary/80 p-2 bg-blue-50 hover:bg-blue-100 rounded transition-colors inline-flex items-center disabled:opacity-50"
      >
        <Edit className="w-4 h-4"/>
      </button>
      <button 
        onClick={handleDelete}
        disabled={loading}
        className="text-red-500 hover:text-red-700 p-2 bg-red-50 hover:bg-red-100 rounded transition-colors inline-flex items-center disabled:opacity-50"
      >
        <Trash2 className="w-4 h-4"/>
      </button>
    </div>
  );
}

export function AddCategoryButton() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleAdd = async () => {
    const name = window.prompt("Enter new category name:");
    if (!name) return;

    const gender = window.prompt("Enter gender (men, women, unisex, kids, accessories):", "unisex");
    if (!gender) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('categories')
        .insert({ name, gender: gender.toLowerCase() });

      if (error) throw error;
      router.refresh();
    } catch (err: any) {
      alert("Failed to add category: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleAdd}
      disabled={loading}
      className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
    >
      <span>{loading ? 'Adding...' : 'Add Category'}</span>
    </button>
  );
}
