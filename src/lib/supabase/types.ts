// Tipos escritos manualmente a partir das migrations em supabase/migrations.
// Assim que houver um projeto Supabase conectado, substituir por:
//   supabase gen types typescript --local > src/lib/supabase/types.ts
export type UserRole = "OWNER" | "MANAGER" | "SALES" | "PRODUCTION" | "FINANCE";
export type UnitOfMeasure = "UNIDADE" | "GRAMA" | "QUILOGRAMA" | "ML" | "LITRO";
export type IngredientKind = "INGREDIENTE" | "INSUMO";
export type MovementType =
  | "ENTRADA"
  | "SAIDA"
  | "AJUSTE"
  | "CONSUMO_PRODUCAO"
  | "PERDA"
  | "DEVOLUCAO";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          organization_id: string;
          full_name: string;
          role: UserRole;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          organization_id: string;
          full_name: string;
          role: UserRole;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          entity: string;
          entity_id: string | null;
          action: string;
          old_data: Json | null;
          new_data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id?: string | null;
          entity: string;
          entity_id?: string | null;
          action: string;
          old_data?: Json | null;
          new_data?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      product_categories: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_categories"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "product_categories_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      suppliers: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          phone: string | null;
          email: string | null;
          notes: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["suppliers"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "suppliers_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      ingredients: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          kind: IngredientKind;
          unit: UnitOfMeasure;
          cost_per_unit: number;
          current_stock: number;
          minimum_stock: number | null;
          supplier_id: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          kind?: IngredientKind;
          unit: UnitOfMeasure;
          cost_per_unit?: number;
          current_stock?: number;
          minimum_stock?: number | null;
          supplier_id?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ingredients"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "ingredients_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ingredients_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          organization_id: string;
          category_id: string | null;
          name: string;
          sku: string | null;
          description: string | null;
          sale_price: number;
          sale_unit: UnitOfMeasure;
          minimum_stock: number | null;
          production_time_minutes: number | null;
          shelf_life_days: number | null;
          photo_url: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          category_id?: string | null;
          name: string;
          sku?: string | null;
          description?: string | null;
          sale_price: number;
          sale_unit?: UnitOfMeasure;
          minimum_stock?: number | null;
          production_time_minutes?: number | null;
          shelf_life_days?: number | null;
          photo_url?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "products_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "product_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      recipes: {
        Row: {
          id: string;
          organization_id: string;
          product_id: string;
          yield_quantity: number;
          additional_cost: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          product_id: string;
          yield_quantity: number;
          additional_cost?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["recipes"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "recipes_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recipes_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: true;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      recipe_items: {
        Row: {
          id: string;
          recipe_id: string;
          ingredient_id: string;
          quantity: number;
          unit: UnitOfMeasure;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          ingredient_id: string;
          quantity: number;
          unit: UnitOfMeasure;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["recipe_items"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "recipe_items_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recipe_items_ingredient_id_fkey";
            columns: ["ingredient_id"];
            isOneToOne: false;
            referencedRelation: "ingredients";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_movements: {
        Row: {
          id: string;
          organization_id: string;
          ingredient_id: string;
          type: MovementType;
          quantity: number;
          unit: UnitOfMeasure;
          reason: string | null;
          reference: string | null;
          user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          ingredient_id: string;
          type: MovementType;
          quantity: number;
          unit: UnitOfMeasure;
          reason?: string | null;
          reference?: string | null;
          user_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["inventory_movements"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "inventory_movements_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_movements_ingredient_id_fkey";
            columns: ["ingredient_id"];
            isOneToOne: false;
            referencedRelation: "ingredients";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_organization_with_owner: {
        Args: { org_name: string; owner_full_name: string };
        Returns: string;
      };
      accept_invitation: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      log_audit_event: {
        Args: {
          p_entity: string;
          p_entity_id: string | null;
          p_action: string;
          p_old_data?: Json | null;
          p_new_data?: Json | null;
        };
        Returns: undefined;
      };
      convert_quantity: {
        Args: { p_quantity: number; p_from_unit: UnitOfMeasure; p_to_unit: UnitOfMeasure };
        Returns: number;
      };
      register_inventory_movement: {
        Args: {
          p_ingredient_id: string;
          p_type: MovementType;
          p_quantity: number;
          p_unit: UnitOfMeasure;
          p_reason?: string | null;
          p_reference?: string | null;
        };
        Returns: string;
      };
      calculate_product_cost: {
        Args: { p_product_id: string };
        Returns: number | null;
      };
      save_recipe: {
        Args: {
          p_product_id: string;
          p_yield_quantity: number;
          p_additional_cost: number;
          p_notes: string | null;
          p_items: Json;
        };
        Returns: string;
      };
    };
    Enums: {
      user_role: UserRole;
      unit_of_measure: UnitOfMeasure;
      ingredient_kind: IngredientKind;
      movement_type: MovementType;
    };
    CompositeTypes: Record<string, never>;
  };
};
